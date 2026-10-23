<?php
/**
 * Read-only WooCommerce product export for the Shopify theme project.
 *
 * Run from the WordPress root:
 *   wp --allow-root eval-file /home/vjranga/Documents/2202/shopify-theme/data/export-products.php
 *
 * Writes:
 *   data/products.json
 *   data/taxonomies.json
 *   data/product-images.json
 *   data/size-guides.json
 *   docs/PRODUCT-CATALOG.md
 *
 * This script does not write to WordPress or the database.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run through wp eval-file.\n");
    exit(1);
}

global $wpdb, $p2202_upload, $p2202_attach_cache, $p2202_missing_attachments, $p2202_image_refs, $p2202_inline_refs;

$p2202_data_dir = __DIR__;
$p2202_docs_dir = dirname(__DIR__) . '/docs';
$p2202_generated = gmdate('c');
$p2202_upload = wp_get_upload_dir();
$p2202_attach_cache = [];
$p2202_missing_attachments = [];
$p2202_image_refs = [];
$p2202_inline_refs = [];

function p2202_json_write($path, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (false === $json) {
        throw new RuntimeException('json_encode failed: ' . json_last_error_msg());
    }
    if (false === file_put_contents($path, $json . "\n")) {
        throw new RuntimeException('Cannot write ' . $path);
    }
}

function p2202_attachment($id) {
    global $p2202_attach_cache, $p2202_upload;
    $id = (int) $id;
    if ($id <= 0) {
        return null;
    }
    if (array_key_exists($id, $p2202_attach_cache)) {
        return $p2202_attach_cache[$id];
    }

    $post = get_post($id);
    if (!$post || 'attachment' !== $post->post_type) {
        $data = ['id' => $id, 'exists' => false, 'error' => 'attachment_not_found'];
        $p2202_attach_cache[$id] = $data;
        return $data;
    }

    $file = (string) get_post_meta($id, '_wp_attached_file', true);
    $meta = wp_get_attachment_metadata($id);
    $path = $file ? trailingslashit($p2202_upload['basedir']) . $file : get_attached_file($id);
    $url = wp_get_attachment_url($id);
    $sizes = [];
    if (is_array($meta) && !empty($meta['sizes']) && is_array($meta['sizes'])) {
        foreach ($meta['sizes'] as $name => $size) {
            if (!is_array($size)) {
                continue;
            }
            $sizes[$name] = [
                'file' => isset($size['file']) ? $size['file'] : null,
                'width' => isset($size['width']) ? (int) $size['width'] : null,
                'height' => isset($size['height']) ? (int) $size['height'] : null,
                'mime_type' => isset($size['mime-type']) ? $size['mime-type'] : null,
            ];
        }
    }

    $data = [
        'id' => $id,
        'title' => get_the_title($id),
        'filename' => $file ? wp_basename($file) : null,
        'relative_path' => $file ?: null,
        'source_path' => $path ?: null,
        'url' => $url ?: null,
        'mime_type' => get_post_mime_type($id) ?: null,
        'width' => is_array($meta) && isset($meta['width']) ? (int) $meta['width'] : null,
        'height' => is_array($meta) && isset($meta['height']) ? (int) $meta['height'] : null,
        'filesize' => $path && file_exists($path) ? filesize($path) : null,
        'alt_text' => (string) get_post_meta($id, '_wp_attachment_image_alt', true),
        'exists' => (bool) ($path && file_exists($path)),
        'sizes' => $sizes,
    ];
    if (!$data['exists']) {
        $p2202_missing_attachments[$id] = $data;
    }
    $p2202_attach_cache[$id] = $data;
    return $data;
}

function p2202_term_path($term, $taxonomy) {
    $names = [$term->name];
    $parent = (int) $term->parent;
    $guard = 0;
    while ($parent > 0 && $guard < 20) {
        $p = get_term($parent, $taxonomy);
        if (!$p || is_wp_error($p)) {
            break;
        }
        array_unshift($names, $p->name);
        $parent = (int) $p->parent;
        $guard++;
    }
    return implode(' > ', $names);
}

function p2202_term_data($term, $taxonomy, $with_products = false) {
    $data = [
        'id' => (int) $term->term_id,
        'name' => $term->name,
        'slug' => $term->slug,
        'parent_id' => (int) $term->parent,
        'path' => p2202_term_path($term, $taxonomy),
        'description' => $term->description,
        'source_product_count' => (int) $term->count,
    ];
    if ('product_cat' === $taxonomy) {
        $thumb = (int) get_term_meta($term->term_id, 'thumbnail_id', true);
        $data['featured_image'] = $thumb > 0 ? p2202_attachment($thumb) : null;
        $link = get_term_link($term);
        $data['url'] = is_wp_error($link) ? null : $link;
    }
    if ($with_products) {
        $ids = get_objects_in_term($term->term_id, $taxonomy);
        $data['product_ids'] = is_wp_error($ids) ? [] : array_map('intval', $ids);
        $data['exported_product_count'] = is_wp_error($ids) ? 0 : count($ids);
    }
    return $data;
}

function p2202_meta($id, $key) {
    return get_post_meta($id, $key, true);
}

function p2202_parse_id_list($value) {
    $value = maybe_unserialize($value);
    if (is_array($value)) {
        $ids = $value;
    } elseif (is_string($value) && '' !== trim($value)) {
        $ids = preg_split('/[\s,|]+/', $value);
    } else {
        $ids = [];
    }
    $ids = array_map('intval', (array) $ids);
    $ids = array_values(array_filter($ids, function ($id) { return $id > 0; }));
    return array_values(array_unique($ids));
}

function p2202_variation_attribute_data($variation) {
    $out = [];
    foreach ($variation->get_attributes() as $key => $value) {
        $entry = [
            'key' => $key,
            'value' => $value,
            'name' => $key,
            'label' => $key,
            'term_id' => null,
            'term_name' => null,
            'term_slug' => null,
        ];
        if (0 === strpos($key, 'pa_')) {
            $taxonomy = $key;
            $entry['name'] = $taxonomy;
            $entry['label'] = wc_attribute_label($taxonomy);
            $term = get_term_by('slug', (string) $value, $taxonomy);
            if ($term && !is_wp_error($term)) {
                $entry['term_id'] = (int) $term->term_id;
                $entry['term_name'] = $term->name;
                $entry['term_slug'] = $term->slug;
                $entry['value'] = $term->name;
            }
        }
        $out[] = $entry;
    }
    return $out;
}

function p2202_extract_inline_images($html, $product_id, $product_name, $role) {
    global $p2202_inline_refs;
    if (!$html || false === stripos($html, '<img')) {
        return;
    }
    if (preg_match_all('/<img\b[^>]*>/i', $html, $tags)) {
        foreach ($tags[0] as $tag) {
            $src = null;
            if (preg_match('/\bsrc\s*=\s*["\']([^"\']+)["\']/i', $tag, $m)) {
                $src = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
            }
            $attachment_id = 0;
            if (preg_match('/\bwp-image-(\d+)\b/i', $tag, $m)) {
                $attachment_id = (int) $m[1];
            } elseif ($src) {
                $attachment_id = (int) attachment_url_to_postid($src);
            }
            if ($attachment_id > 0) {
                p2202_attachment($attachment_id);
            }
            $p2202_inline_refs[] = [
                'product_id' => (int) $product_id,
                'product_name' => $product_name,
                'role' => $role,
                'attachment_id' => $attachment_id ?: null,
                'url' => $src,
                'html_tag' => $tag,
            ];
        }
    }
}

$p2202_source_counts = [];
$rows = $wpdb->get_results("SELECT post_status, COUNT(*) AS c FROM {$wpdb->posts} WHERE post_type = 'product' GROUP BY post_status", OBJECT_K);
foreach ($rows as $status => $row) {
    $p2202_source_counts[$status] = (int) $row->c;
}
$p2202_source_variation_counts = [];
$rows = $wpdb->get_results("SELECT post_status, COUNT(*) AS c FROM {$wpdb->posts} WHERE post_type = 'product_variation' GROUP BY post_status", OBJECT_K);
foreach ($rows as $status => $row) {
    $p2202_source_variation_counts[$status] = (int) $row->c;
}

$status_seed = ['publish' => 0, 'draft' => 0, 'private' => 0, 'trash' => 0, 'pending' => 0, 'future' => 0, 'auto-draft' => 0];
$all_statuses = array_unique(array_merge(array_keys($status_seed), array_keys($p2202_source_counts), array_keys($p2202_source_variation_counts)));
sort($all_statuses);

$product_ids = get_posts([
    'post_type' => 'product',
    'post_status' => $all_statuses,
    'posts_per_page' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'fields' => 'ids',
    'suppress_filters' => true,
    'no_found_rows' => true,
]);

$products = [];
$product_status_counts = array_fill_keys($all_statuses, 0);
$variation_status_counts = array_fill_keys($all_statuses, 0);
$type_counts = [];
$exported_variation_total = 0;
$products_without_featured_image = 0;
$products_without_variations = 0;
$out_of_stock_products = 0;
$featured_products = 0;
$size_guides_used = [];

foreach ($product_ids as $pid) {
    $product = wc_get_product($pid);
    if (!$product) {
        continue;
    }

    $status = get_post_status($pid);
    $product_status_counts[$status] = ($product_status_counts[$status] ?? 0) + 1;
    $type = $product->get_type();
    $type_counts[$type] = ($type_counts[$type] ?? 0) + 1;
    if ($product->is_featured()) {
        $featured_products++;
    }
    if ('outofstock' === $product->get_stock_status()) {
        $out_of_stock_products++;
    }

    $featured_image_id = (int) $product->get_image_id();
    if ($featured_image_id <= 0) {
        $products_without_featured_image++;
    }
    $gallery_ids = array_map('intval', $product->get_gallery_image_ids());
    $background_id = (int) p2202_meta($pid, '_woodmart_product-background');
    $image_360_ids = p2202_parse_id_list(p2202_meta($pid, '_product_360_image_gallery'));

    $featured_attachment = $featured_image_id > 0 ? p2202_attachment($featured_image_id) : null;
    $gallery_attachments = [];
    foreach ($gallery_ids as $gid) {
        $gallery_attachments[] = p2202_attachment($gid);
    }
    $background_attachment = $background_id > 0 ? p2202_attachment($background_id) : null;
    $image_360_attachments = [];
    foreach ($image_360_ids as $gid) {
        $image_360_attachments[] = p2202_attachment($gid);
    }

    $refs = [];
    if ($featured_attachment) {
        $refs[] = ['role' => 'featured', 'variation_id' => null, 'attachment' => $featured_attachment];
    }
    foreach ($gallery_attachments as $index => $att) {
        if ($att) {
            $refs[] = ['role' => 'gallery', 'gallery_index' => $index, 'variation_id' => null, 'attachment' => $att];
        }
    }
    if ($background_attachment) {
        $refs[] = ['role' => 'background', 'variation_id' => null, 'attachment' => $background_attachment];
    }
    foreach ($image_360_attachments as $index => $att) {
        if ($att) {
            $refs[] = ['role' => 'image_360', 'gallery_index' => $index, 'variation_id' => null, 'attachment' => $att];
        }
    }

    $attributes = [];
    foreach ($product->get_attributes() as $key => $attr) {
        $attribute = [
            'key' => $key,
            'name' => $attr->get_name(),
            'label' => wc_attribute_label($attr->get_name()),
            'is_taxonomy' => $attr->is_taxonomy(),
            'is_variation' => $attr->get_variation(),
            'is_visible' => $attr->get_visible(),
            'position' => $attr->get_position(),
            'options_raw' => $attr->get_options(),
            'terms' => [],
            'values' => [],
        ];
        if ($attr->is_taxonomy()) {
            $taxonomy = $attr->get_name();
            foreach ($attr->get_terms() as $term) {
                if (is_wp_error($term)) {
                    continue;
                }
                $attribute['terms'][] = [
                    'term_id' => (int) $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'description' => $term->description,
                    'count' => (int) $term->count,
                ];
                $attribute['values'][] = $term->name;
            }
            $attribute['taxonomy'] = $taxonomy;
        } else {
            foreach ((array) $attr->get_options() as $value) {
                $attribute['values'][] = $value;
            }
        }
        $attributes[] = $attribute;
    }

    $categories = [];
    foreach (wp_get_post_terms($pid, 'product_cat') as $term) {
        if (is_wp_error($term)) {
            continue;
        }
        $categories[] = [
            'id' => (int) $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'parent_id' => (int) $term->parent,
            'path' => p2202_term_path($term, 'product_cat'),
        ];
    }
    $tags = [];
    foreach (wp_get_post_terms($pid, 'product_tag') as $term) {
        if (!is_wp_error($term)) {
            $tags[] = ['id' => (int) $term->term_id, 'name' => $term->name, 'slug' => $term->slug];
        }
    }
    $brands = [];
    foreach (wp_get_post_terms($pid, 'product_brand') as $term) {
        if (!is_wp_error($term)) {
            $brands[] = ['id' => (int) $term->term_id, 'name' => $term->name, 'slug' => $term->slug];
        }
    }
    $product_type_terms = [];
    foreach (wp_get_post_terms($pid, 'product_type') as $term) {
        if (!is_wp_error($term)) {
            $product_type_terms[] = ['id' => (int) $term->term_id, 'name' => $term->name, 'slug' => $term->slug];
        }
    }
    $visibility_terms = [];
    foreach (wp_get_post_terms($pid, 'product_visibility') as $term) {
        if (!is_wp_error($term)) {
            $visibility_terms[] = ['id' => (int) $term->term_id, 'name' => $term->name, 'slug' => $term->slug];
        }
    }

    $variations = [];
    $variation_stock_counts = ['instock' => 0, 'outofstock' => 0, 'onbackorder' => 0];
    if ($product->is_type('variable')) {
        foreach ($product->get_children() as $vid) {
            $variation = wc_get_product($vid);
            if (!$variation) {
                continue;
            }
            $exported_variation_total++;
            $vstatus = get_post_status($vid);
            $variation_status_counts[$vstatus] = ($variation_status_counts[$vstatus] ?? 0) + 1;
            $vstock = $variation->get_stock_status();
            if (isset($variation_stock_counts[$vstock])) {
                $variation_stock_counts[$vstock]++;
            }

            $vimage_id = (int) $variation->get_image_id();
            $vimage = $vimage_id > 0 ? p2202_attachment($vimage_id) : null;
            $vgallery_ids = array_map('intval', $variation->get_gallery_image_ids());
            $vgallery = [];
            foreach ($vgallery_ids as $gid) {
                $vgallery[] = p2202_attachment($gid);
            }
            $additional_id = (int) p2202_meta($vid, 'wd_additional_variation_images_data');
            $additional = $additional_id > 0 ? p2202_attachment($additional_id) : null;

            if ($vimage) {
                $refs[] = ['role' => 'variation_featured', 'variation_id' => (int) $vid, 'attachment' => $vimage];
            }
            foreach ($vgallery as $index => $att) {
                if ($att) {
                    $refs[] = ['role' => 'variation_gallery', 'gallery_index' => $index, 'variation_id' => (int) $vid, 'attachment' => $att];
                }
            }
            if ($additional) {
                $refs[] = ['role' => 'variation_additional', 'variation_id' => (int) $vid, 'attachment' => $additional];
            }

            $vattr = p2202_variation_attribute_data($variation);
            $size_names = [];
            foreach ($vattr as $a) {
                if ('pa_size' === $a['key']) {
                    $size_names[] = $a['term_name'] ?: $a['value'];
                }
            }

            $variations[] = [
                'id' => (int) $vid,
                'parent_id' => (int) $pid,
                'parent_slug' => $product->get_slug(),
                'name' => $variation->get_name(),
                'slug' => get_post_field('post_name', $vid),
                'status' => $vstatus,
                'sku' => $variation->get_sku(),
                'description_html' => $variation->get_description(),
                'prices' => [
                    'currency' => get_woocommerce_currency(),
                    'current' => $variation->get_price(),
                    'regular' => $variation->get_regular_price(),
                    'sale' => $variation->get_sale_price(),
                ],
                'attributes' => $vattr,
                'size' => $size_names ? implode(', ', $size_names) : null,
                'stock' => [
                    'status' => $vstock,
                    'quantity' => $variation->get_stock_quantity(),
                    'manage_stock' => $variation->managing_stock(),
                    'backorders' => $variation->get_backorders(),
                    'backorders_allowed' => $variation->backorders_allowed(),
                    'is_in_stock' => $variation->is_in_stock(),
                ],
                'weight' => $variation->get_weight(),
                'dimensions' => [
                    'length' => $variation->get_length(),
                    'width' => $variation->get_width(),
                    'height' => $variation->get_height(),
                    'unit' => get_option('woocommerce_dimension_unit'),
                ],
                'image_id' => $vimage_id ?: null,
                'featured_image' => $vimage,
                'gallery_image_ids' => $vgallery_ids,
                'gallery_images' => $vgallery,
                'menu_order' => $variation->get_menu_order(),
            ];
        }
    }
    if (empty($variations)) {
        $products_without_variations++;
    }

    $size_guide_id = (int) p2202_meta($pid, 'woodmart_sguide_select');
    $size_guide = null;
    if ($size_guide_id > 0) {
        $guide_post = get_post($size_guide_id);
        if ($guide_post && 'woodmart_size_guide' === $guide_post->post_type) {
            $size_guide = [
                'id' => (int) $guide_post->ID,
                'title' => $guide_post->post_title,
                'slug' => $guide_post->post_name,
                'status' => $guide_post->post_status,
                'content_html' => $guide_post->post_content,
            ];
            $size_guides_used[$size_guide_id] = ($size_guides_used[$size_guide_id] ?? 0) + 1;
        }
    }

    $custom_tabs = [];
    foreach (['', '_2', '_3', '_4', '_5'] as $suffix) {
        $tab = [
            'index' => '' === $suffix ? 1 : (int) substr($suffix, 1),
            'title' => p2202_meta($pid, '_woodmart_product_custom_tab_title' . $suffix),
            'content_html' => p2202_meta($pid, '_woodmart_product_custom_tab_content' . $suffix),
            'content_type' => p2202_meta($pid, '_woodmart_product_custom_tab_content_type' . $suffix),
            'priority' => p2202_meta($pid, '_woodmart_product_custom_tab_priority' . $suffix),
            'html_block_id' => p2202_meta($pid, '_woodmart_product_custom_tab_html_block' . $suffix),
        ];
        $has_content = false;
        foreach ($tab as $k => $v) {
            if (!in_array($k, ['index'], true) && is_string($v) && '' !== trim($v)) {
                $has_content = true;
            }
        }
        if ($has_content) {
            $custom_tabs[] = $tab;
        }
    }

    $custom_fields = [
        'size_guide_id' => $size_guide_id ?: null,
        'new_label' => p2202_meta($pid, '_woodmart_new_label'),
        'new_label_date' => p2202_meta($pid, '_woodmart_new_label_date'),
        'price_unit_of_measure' => p2202_meta($pid, 'woodmart_price_unit_of_measure'),
        'extra_content_html' => p2202_meta($pid, '_woodmart_extra_content'),
        'extra_content_position' => p2202_meta($pid, '_woodmart_extra_position'),
        'exclude_show_single_variation' => p2202_meta($pid, '_woodmart_exclude_show_single_variation'),
        'related_disabled' => (bool) p2202_meta($pid, '_woodmart_related_off'),
        'personalisation_set_id' => (int) p2202_meta($pid, '_wcpp_set_id') ?: null,
        'custom_tabs' => $custom_tabs,
    ];

    $related_ids = [];
    try {
        $related_ids = array_map('intval', wc_get_related_products($pid, 5));
    } catch (Throwable $e) {
        $related_ids = [];
    }

    $product_data = [
        'id' => (int) $pid,
        'parent_id' => null,
        'name' => $product->get_name(),
        'slug' => $product->get_slug(),
        'permalink' => get_permalink($pid),
        'status' => $status,
        'type' => $type,
        'sku' => $product->get_sku(),
        'created' => get_post_field('post_date_gmt', $pid),
        'modified' => get_post_field('post_modified_gmt', $pid),
        'menu_order' => $product->get_menu_order(),
        'descriptions' => [
            'full_html' => get_post_field('post_content', $pid),
            'short_html' => get_post_field('post_excerpt', $pid),
            'full_text' => wp_strip_all_tags(get_post_field('post_content', $pid)),
            'short_text' => wp_strip_all_tags(get_post_field('post_excerpt', $pid)),
        ],
        'prices' => [
            'currency' => get_woocommerce_currency(),
            'current' => $product->get_price(),
            'regular' => $product->get_regular_price(),
            'sale' => $product->get_sale_price(),
            'min_current' => $product->is_type('variable') ? $product->get_variation_price('min', true) : $product->get_price(),
            'max_current' => $product->is_type('variable') ? $product->get_variation_price('max', true) : $product->get_price(),
            'min_regular' => $product->is_type('variable') ? $product->get_variation_regular_price('min', true) : $product->get_regular_price(),
            'max_regular' => $product->is_type('variable') ? $product->get_variation_regular_price('max', true) : $product->get_regular_price(),
            'min_sale' => $product->is_type('variable') ? $product->get_variation_sale_price('min', true) : $product->get_sale_price(),
            'max_sale' => $product->is_type('variable') ? $product->get_variation_sale_price('max', true) : $product->get_sale_price(),
            'display_html' => $product->get_price_html(),
            'display_text' => trim(wp_strip_all_tags($product->get_price_html())),
        ],
        'visibility' => [
            'catalog_visibility' => $product->get_catalog_visibility(),
            'featured' => $product->is_featured(),
            'purchasable' => $product->is_purchasable(),
            'virtual' => $product->is_virtual(),
            'downloadable' => $product->is_downloadable(),
            'tax_status' => $product->get_tax_status(),
            'tax_class' => $product->get_tax_class(),
            'sold_individually' => $product->is_sold_individually(),
            'reviews_allowed' => $product->get_reviews_allowed(),
        ],
        'stock' => [
            'status' => $product->get_stock_status(),
            'quantity' => $product->get_stock_quantity(),
            'manage_stock' => $product->managing_stock(),
            'backorders' => $product->get_backorders(),
            'backorders_allowed' => $product->backorders_allowed(),
            'is_in_stock' => $product->is_in_stock(),
            'low_stock_amount' => $product->get_low_stock_amount(),
            'variation_stock_counts' => $variation_stock_counts,
        ],
        'weight' => $product->get_weight(),
        'dimensions' => [
            'length' => $product->get_length(),
            'width' => $product->get_width(),
            'height' => $product->get_height(),
            'unit' => get_option('woocommerce_dimension_unit'),
        ],
        'attributes' => $attributes,
        'categories' => $categories,
        'tags' => $tags,
        'brands' => $brands,
        'product_type_terms' => $product_type_terms,
        'visibility_terms' => $visibility_terms,
        'featured_image_id' => $featured_image_id ?: null,
        'featured_image' => $featured_attachment,
        'gallery_image_ids' => $gallery_ids,
        'gallery_images' => $gallery_attachments,
        'background_image_id' => $background_id ?: null,
        'background_image' => $background_attachment,
        'image_360_ids' => $image_360_ids,
        'image_360_images' => $image_360_attachments,
        'variation_count' => count($variations),
        'variations' => $variations,
        'related_product_ids' => $related_ids,
        'upsell_ids' => array_map('intval', $product->get_upsell_ids()),
        'cross_sell_ids' => array_map('intval', $product->get_cross_sell_ids()),
        'size_guide' => $size_guide,
        'custom_fields' => $custom_fields,
    ];

    $products[] = $product_data;

    foreach ($refs as $ref) {
        $att = $ref['attachment'];
        $p2202_image_refs[] = [
            'product_id' => (int) $pid,
            'product_name' => $product->get_name(),
            'product_status' => $status,
            'role' => $ref['role'],
            'variation_id' => $ref['variation_id'],
            'gallery_index' => $ref['gallery_index'] ?? null,
            'attachment_id' => (int) $att['id'],
            'url' => $att['url'] ?? null,
            'source_path' => $att['source_path'] ?? null,
            'filename' => $att['filename'] ?? null,
            'exists' => $att['exists'] ?? false,
        ];
    }

    p2202_extract_inline_images($product_data['descriptions']['full_html'], $pid, $product->get_name(), 'inline_description');
    p2202_extract_inline_images($product_data['descriptions']['short_html'], $pid, $product->get_name(), 'inline_short_description');
    foreach ($custom_tabs as $tab) {
        p2202_extract_inline_images($tab['content_html'] ?? '', $pid, $product->get_name(), 'inline_custom_tab');
    }
    p2202_extract_inline_images($custom_fields['extra_content_html'] ?? '', $pid, $product->get_name(), 'inline_extra_content');
    if ($size_guide) {
        p2202_extract_inline_images($size_guide['content_html'] ?? '', $pid, $product->get_name(), 'inline_size_guide');
    }
}

$exported_product_total = count($products);
$source_product_total = array_sum($p2202_source_counts);
$source_variation_total = array_sum($p2202_source_variation_counts);
if ($exported_product_total !== $source_product_total) {
    throw new RuntimeException("Product total mismatch: source={$source_product_total}, exported={$exported_product_total}");
}
if ($exported_variation_total !== $source_variation_total) {
    throw new RuntimeException("Variation total mismatch: source={$source_variation_total}, exported={$exported_variation_total}");
}

foreach (array_keys($status_seed) as $status) {
    if (!isset($product_status_counts[$status])) {
        $product_status_counts[$status] = 0;
    }
    if (!isset($variation_status_counts[$status])) {
        $variation_status_counts[$status] = 0;
    }
}
ksort($product_status_counts);
ksort($variation_status_counts);

$currency_code = get_woocommerce_currency();
$currency_data = [
    'code' => $currency_code,
    'symbol' => get_woocommerce_currency_symbol($currency_code),
    'position' => get_option('woocommerce_currency_pos'),
    'decimals' => (int) get_option('woocommerce_price_num_decimals'),
    'thousand_separator' => get_option('woocommerce_price_thousand_sep'),
    'decimal_separator' => get_option('woocommerce_price_decimal_sep'),
];

$source_meta = [
    'platform' => 'WordPress + WooCommerce',
    'wordpress_version' => get_bloginfo('version'),
    'woocommerce_version' => defined('WC_VERSION') ? WC_VERSION : null,
    'site_url' => get_site_url(),
    'installation_path' => ABSPATH,
    'table_prefix' => $wpdb->prefix,
    'source_post_type' => 'product',
    'read_only' => true,
];

$products_payload = [
    'schema_version' => 1,
    'generated_at' => $p2202_generated,
    'source' => $source_meta,
    'currency' => $currency_data,
    'counts' => [
        'source' => [
            'products_total' => $source_product_total,
            'products_by_status' => $p2202_source_counts,
            'variations_total' => $source_variation_total,
            'variations_by_status' => $p2202_source_variation_counts,
        ],
        'exported' => [
            'products_total' => $exported_product_total,
            'products_by_status' => $product_status_counts,
            'variations_total' => $exported_variation_total,
            'variations_by_status' => $variation_status_counts,
            'products_by_type' => $type_counts,
            'featured_products' => $featured_products,
            'out_of_stock_products' => $out_of_stock_products,
            'products_without_featured_image' => $products_without_featured_image,
            'simple_products_without_variations' => $products_without_variations,
        ],
    ],
    'products' => $products,
    'limitations' => [
        'Only products and product variations are exported. Customers, orders, users, coupons, and private options are intentionally excluded.',
        'All source products currently have publish status; draft, private, trash, pending, future, and auto-draft counts are zero unless stated otherwise.',
        'Product weights and dimensions are empty in the source data for all products and variations.',
        'Most product-level SKUs are empty; only 16 products have a SKU. Variation SKUs are empty.',
        'Variable parent products have no single regular or sale price; use variation prices and the min/max price fields.',
        'Three source variations have neither a current nor a regular price: 30081 (Island Bloom PJ Set - UK06/XS), 30741 (Bluebell Waffle PJ Set - UK12/L), and 31063 (Olive Rib Midi Skirt - UK08/S). Treat these as incomplete source data and confirm prices before import.',
        'Related product IDs follow WooCommerce related-product logic (shared categories/tags, limit 5). Upsell and cross-sell IDs are empty in the source.',
        'No product tags or product brands are assigned in the source data.',
        'Color exists as a custom (non-taxonomy) attribute on one product only; all other variation attributes use pa_size.',
        'Image URLs point to the local WordPress site and are not rewritten for Shopify.',
        'Rich text is preserved as source HTML; no content rewriting or normalization was performed.',
        'WooCommerce category term counts can be stale because they rely on cached taxonomy counts. data/taxonomies.json therefore includes both source_product_count and exported_product_count; the exported relationship count is authoritative.',
    ],
];

p2202_json_write($p2202_data_dir . '/products.json', $products_payload);

$taxonomy_payload = [
    'schema_version' => 1,
    'generated_at' => $p2202_generated,
    'source' => $source_meta,
    'taxonomies' => [],
];
foreach (['product_cat', 'product_tag', 'product_brand', 'product_type', 'product_visibility', 'pa_size'] as $taxonomy) {
    if (!taxonomy_exists($taxonomy)) {
        $taxonomy_payload['taxonomies'][$taxonomy] = ['exists' => false, 'terms' => []];
        continue;
    }
    $terms = get_terms(['taxonomy' => $taxonomy, 'hide_empty' => false, 'orderby' => 'term_id', 'order' => 'ASC']);
    $items = [];
    if (!is_wp_error($terms)) {
        foreach ($terms as $term) {
            $items[] = p2202_term_data($term, $taxonomy, true);
        }
    }
    $taxonomy_payload['taxonomies'][$taxonomy] = [
        'exists' => true,
        'label' => get_taxonomy($taxonomy)->labels->name,
        'hierarchical' => is_taxonomy_hierarchical($taxonomy),
        'total_terms' => count($items),
        'terms' => $items,
    ];
}
p2202_json_write($p2202_data_dir . '/taxonomies.json', $taxonomy_payload);

foreach ($p2202_inline_refs as $i => $ref) {
    if (!empty($ref['attachment_id'])) {
        $att = p2202_attachment((int) $ref['attachment_id']);
        $p2202_inline_refs[$i]['url'] = $ref['url'] ?: ($att['url'] ?? null);
        $p2202_inline_refs[$i]['source_path'] = $att['source_path'] ?? null;
        $p2202_inline_refs[$i]['filename'] = $att['filename'] ?? null;
        $p2202_inline_refs[$i]['exists'] = $att['exists'] ?? false;
    } else {
        $p2202_inline_refs[$i]['source_path'] = null;
        $p2202_inline_refs[$i]['filename'] = null;
        $p2202_inline_refs[$i]['exists'] = false;
    }
}

$attachment_ids = [];
foreach ($p2202_attach_cache as $id => $att) {
    $attachment_ids[] = (int) $id;
}
sort($attachment_ids);
$attachments = [];
foreach ($attachment_ids as $id) {
    $attachments[] = p2202_attachment($id);
}

$image_payload = [
    'schema_version' => 1,
    'generated_at' => $p2202_generated,
    'source' => $source_meta,
    'summary' => [
        'referenced_attachment_count' => count($attachments),
        'reference_count' => count($p2202_image_refs),
        'inline_reference_count' => count($p2202_inline_refs),
        'missing_attachment_count' => count($p2202_missing_attachments),
    ],
    'attachments' => $attachments,
    'references' => $p2202_image_refs,
    'inline_references' => $p2202_inline_refs,
    'missing_attachments' => array_values($p2202_missing_attachments),
];
p2202_json_write($p2202_data_dir . '/product-images.json', $image_payload);

$size_guides = [];
$guide_query = get_posts([
    'post_type' => 'woodmart_size_guide',
    'post_status' => $all_statuses,
    'posts_per_page' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'suppress_filters' => true,
]);
foreach ($guide_query as $guide) {
    $size_guides[] = [
        'id' => (int) $guide->ID,
        'title' => $guide->post_title,
        'slug' => $guide->post_name,
        'status' => $guide->post_status,
        'content_html' => $guide->post_content,
        'content_text' => wp_strip_all_tags($guide->post_content),
        'used_by_product_count' => $size_guides_used[$guide->ID] ?? 0,
        'permalink' => get_permalink($guide->ID),
    ];
}
$size_guide_payload = [
    'schema_version' => 1,
    'generated_at' => $p2202_generated,
    'source' => $source_meta,
    'total' => count($size_guides),
    'size_guides' => $size_guides,
];
p2202_json_write($p2202_data_dir . '/size-guides.json', $size_guide_payload);

$md_escape = function ($value) {
    $value = (string) $value;
    return str_replace(["|", "\r", "\n"], ["\\|", ' ', ' '], $value);
};
$dash = function ($value) use ($md_escape) {
    $value = trim((string) $value);
    return '' === $value ? '—' : $md_escape($value);
};
$money = function ($value) {
    if (null === $value || '' === $value) {
        return null;
    }
    return 'Rs. ' . number_format((float) $value, 2, '.', ',');
};
$price_range = function ($min, $max) use ($money) {
    $a = $money($min);
    $b = $money($max);
    if (null === $a && null === $b) {
        return '—';
    }
    if (null === $b || $a === $b) {
        return $a;
    }
    return $a . ' – ' . $b;
};

$lines = [];
$lines[] = '# 2202 Love Colombo — Product Catalog Export';
$lines[] = '';
$lines[] = 'Generated: ' . $p2202_generated;
$lines[] = '';
$lines[] = 'Source: WordPress ' . $source_meta['wordpress_version'] . ' + WooCommerce ' . $source_meta['woocommerce_version'] . ' at ' . $source_meta['site_url'];
$lines[] = '';
$lines[] = 'Machine-readable data: `data/products.json`, `data/taxonomies.json`, `data/product-images.json`, `data/size-guides.json`.';
$lines[] = '';
$lines[] = 'This export is read-only. WordPress and the database were not modified.';
$lines[] = '';
$lines[] = '## Verification counts';
$lines[] = '';
$lines[] = '| Measure | Source | Exported |';
$lines[] = '| --- | ---: | ---: |';
$lines[] = '| Products, total | ' . $source_product_total . ' | ' . $exported_product_total . ' |';
foreach (['publish', 'draft', 'private', 'trash', 'pending', 'future'] as $status) {
    $src = $p2202_source_counts[$status] ?? 0;
    $exp = $product_status_counts[$status] ?? 0;
    $lines[] = '| Products, ' . $status . ' | ' . $src . ' | ' . $exp . ' |';
}
$lines[] = '| Variations, total | ' . $source_variation_total . ' | ' . $exported_variation_total . ' |';
foreach ($variation_status_counts as $status => $count) {
    $src = $p2202_source_variation_counts[$status] ?? 0;
    $lines[] = '| Variations, ' . $status . ' | ' . $src . ' | ' . $count . ' |';
}
$lines[] = '';
$lines[] = 'Additional exported facts: ' . $featured_products . ' featured products, ' . $out_of_stock_products . ' out-of-stock products, ' . $products_without_featured_image . ' products without a featured image.';
$lines[] = '';
$lines[] = 'Currency: ' . $currency_data['code'] . ' (' . $currency_data['symbol'] . '), symbol position ' . $currency_data['position'] . ', ' . $currency_data['decimals'] . ' decimals.';
$lines[] = '';
$lines[] = '## Products';
$lines[] = '';
$lines[] = '| ID | Name | Slug | Type | Status | Current price | Regular price | Stock | Variations | Sizes / attributes | Categories | Images (featured/gallery) | SKU |';
$lines[] = '| ---: | --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |';
foreach ($products as $p) {
    $prices = $p['prices'];
    $current = $price_range($prices['min_current'], $prices['max_current']);
    $regular = $price_range($prices['min_regular'], $prices['max_regular']);
    $stock = $p['stock']['status'];
    if (null !== $p['stock']['quantity']) {
        $stock .= ' (' . $p['stock']['quantity'] . ')';
    }
    $attrs = [];
    foreach ($p['attributes'] as $attr) {
        $attrs[] = $attr['label'] . ': ' . implode(', ', $attr['values']);
    }
    $cats = array_map(function ($c) { return $c['name']; }, $p['categories']);
    $img = ($p['featured_image_id'] ? 1 : 0) . '/' . count($p['gallery_image_ids']);
    $lines[] = '| ' . $p['id'] . ' | ' . $md_escape($p['name']) . ' | ' . $md_escape($p['slug']) . ' | ' . $p['type'] . ' | ' . $p['status'] . ' | ' . $current . ' | ' . $regular . ' | ' . $md_escape($stock) . ' | ' . $p['variation_count'] . ' | ' . $dash(implode('; ', $attrs)) . ' | ' . $dash(implode(', ', $cats)) . ' | ' . $img . ' | ' . $dash($p['sku']) . ' |';
}
$lines[] = '';
$lines[] = '## Categories';
$lines[] = '';
$lines[] = '| ID | Name | Slug | Parent | Path | Products (term count) | Products (exported relationships) |';
$lines[] = '| ---: | --- | --- | --- | --- | ---: | ---: |';
$cat_tax = $taxonomy_payload['taxonomies']['product_cat'];
foreach ($cat_tax['terms'] as $term) {
    $parent = $term['parent_id'] ? (string) $term['parent_id'] : '—';
    $lines[] = '| ' . $term['id'] . ' | ' . $md_escape($term['name']) . ' | ' . $md_escape($term['slug']) . ' | ' . $parent . ' | ' . $md_escape($term['path']) . ' | ' . $term['source_product_count'] . ' | ' . $term['exported_product_count'] . ' |';
}
$lines[] = '';
$lines[] = 'No category has a featured image assigned. Product tags and product brands are empty.';
$lines[] = '';
$lines[] = 'The term count column is WooCommerce\'s cached taxonomy count. Two categories have stale source counts: Tops shows 33 but has 32 exported product relationships, and Bottoms shows 26 but has 23. The exported relationship count is authoritative.';
$lines[] = '';
$lines[] = '## Attributes';
$lines[] = '';
$size_tax = $taxonomy_payload['taxonomies']['pa_size'];
$lines[] = '### pa_size (Product Size)';
$lines[] = '';
$lines[] = '| Term ID | Name | Slug | Product usage count |';
$lines[] = '| ---: | --- | --- | ---: |';
foreach ($size_tax['terms'] as $term) {
    $lines[] = '| ' . $term['id'] . ' | ' . $md_escape($term['name']) . ' | ' . $md_escape($term['slug']) . ' | ' . $term['source_product_count'] . ' |';
}
$lines[] = '';
$lines[] = '### Custom attributes';
$lines[] = '';
$custom_color_products = [];
foreach ($products as $p) {
    foreach ($p['attributes'] as $attr) {
        if (!$attr['is_taxonomy'] && !empty($attr['values'])) {
            $custom_color_products[] = $p['id'] . ' ' . $p['name'] . ': ' . $attr['label'] . ' = ' . implode(', ', $attr['values']);
        }
    }
}
if ($custom_color_products) {
    foreach ($custom_color_products as $line) {
        $lines[] = '- ' . $md_escape($line);
    }
} else {
    $lines[] = 'No custom product attributes.';
}
$lines[] = '';
$lines[] = '## Size guides';
$lines[] = '';
$lines[] = '| ID | Title | Slug | Status | Products using it |';
$lines[] = '| ---: | --- | --- | --- | ---: |';
foreach ($size_guides as $guide) {
    $lines[] = '| ' . $guide['id'] . ' | ' . $md_escape($guide['title']) . ' | ' . $md_escape($guide['slug']) . ' | ' . $guide['status'] . ' | ' . $guide['used_by_product_count'] . ' |';
}
$lines[] = '';
$lines[] = 'Size-guide HTML is preserved in `data/size-guides.json` and in each product\'s `size_guide` field.';
$lines[] = '';
$lines[] = '## Images';
$lines[] = '';
$lines[] = '| Measure | Count |';
$lines[] = '| --- | ---: |';
$lines[] = '| Referenced attachments | ' . count($attachments) . ' |';
$lines[] = '| Product image references | ' . count($p2202_image_refs) . ' |';
$lines[] = '| Inline content image references | ' . count($p2202_inline_refs) . ' |';
$lines[] = '| Missing attachment files | ' . count($p2202_missing_attachments) . ' |';
$lines[] = '';
$lines[] = 'All references, attachment IDs, source filesystem paths, and source URLs are in `data/product-images.json`.';
$lines[] = '';
$lines[] = '## Limitations and exclusions';
$lines[] = '';
foreach ($products_payload['limitations'] as $limitation) {
    $lines[] = '- ' . $limitation;
}
$lines[] = '- Product text, slugs, HTML, prices, and stock values are copied from the local source as-is. Confirm commercial details before publishing.';
$lines[] = '- No theme, demo, image, or Shopify implementation files were changed by this export.';
$lines[] = '';
$lines[] = '## Export method';
$lines[] = '';
$lines[] = 'Reproducible script: `data/export-products.php`. Run from the WordPress root:';
$lines[] = '';
$lines[] = '```bash';
$lines[] = 'wp --allow-root eval-file /home/vjranga/Documents/2202/shopify-theme/data/export-products.php';
$lines[] = '```';
$lines[] = '';
$lines[] = 'The script queries WooCommerce objects and the WordPress database read-only, writes the JSON files, and regenerates this document.';

$markdown = implode("\n", $lines) . "\n";
if (false === file_put_contents($p2202_docs_dir . '/PRODUCT-CATALOG.md', $markdown)) {
    throw new RuntimeException('Cannot write PRODUCT-CATALOG.md');
}

echo json_encode([
    'products' => $exported_product_total,
    'product_status_counts' => $product_status_counts,
    'variations' => $exported_variation_total,
    'variation_status_counts' => $variation_status_counts,
    'product_types' => $type_counts,
    'categories' => $cat_tax['total_terms'],
    'size_guides' => count($size_guides),
    'image_attachments' => count($attachments),
    'image_references' => count($p2202_image_refs),
    'inline_references' => count($p2202_inline_refs),
    'missing_attachments' => count($p2202_missing_attachments),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
