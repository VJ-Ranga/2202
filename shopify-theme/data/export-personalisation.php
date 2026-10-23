<?php
/**
 * Read-only export of the public product-personalisation configuration.
 *
 * Run from the WordPress root:
 *   wp --allow-root eval-file data/export-personalisation.php
 *
 * Writes data/personalisation.json. Does not write to WordPress.
 * Only presentation/configuration fields are exported. Customer, order, cart,
 * user, licence, and update-check data are deliberately excluded.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run through wp eval-file.\n");
    exit(1);
}

require_once ABSPATH . 'wp-admin/includes/plugin.php';

$out_path = __DIR__ . '/personalisation.json';
$plugin_file = WP_PLUGIN_DIR . '/wc-personalisation-panel/wc-personalisation-panel.php';
$plugin_data = file_exists($plugin_file) ? get_plugin_data($plugin_file, false, false) : [];

$sets = [];
$set_posts = get_posts([
    'post_type' => 'wcpp_personalisation',
    'post_status' => ['publish', 'draft', 'private', 'pending', 'future'],
    'posts_per_page' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
]);

$all_image_ids = [];
foreach ($set_posts as $post) {
    $assigned_category_ids = array_map('intval', (array) maybe_unserialize(get_post_meta($post->ID, '_wcpp_assigned_categories', true)));
    $categories = [];
    foreach ($assigned_category_ids as $term_id) {
        $term = get_term($term_id, 'product_cat');
        if ($term && !is_wp_error($term)) {
            $categories[] = ['id' => (int) $term->term_id, 'name' => $term->name, 'slug' => $term->slug];
        }
    }

    $product_query = new WP_Query([
        'post_type' => 'product',
        'post_status' => ['publish', 'draft', 'private', 'pending', 'future'],
        'posts_per_page' => -1,
        'fields' => 'ids',
        'meta_key' => '_wcpp_set_id',
        'meta_value' => (string) $post->ID,
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
    ]);
    $assigned_products = [];
    foreach ($product_query->posts as $pid) {
        $assigned_products[] = [
            'id' => (int) $pid,
            'name' => get_the_title($pid),
            'slug' => get_post_field('post_name', $pid),
            'status' => get_post_status($pid),
        ];
    }

    $placements = get_post_meta($post->ID, '_wcpp_placements', true);
    if (!is_array($placements)) {
        $placements = [];
    }
    foreach ($placements as $placement) {
        if (!empty($placement['image_id'])) {
            $all_image_ids[] = (int) $placement['image_id'];
        }
        foreach ((array) ($placement['steps'] ?? []) as $step) {
            foreach ((array) ($step['choices'] ?? []) as $choice) {
                if (!empty($choice['image_id'])) {
                    $all_image_ids[] = (int) $choice['image_id'];
                }
            }
        }
    }

    $sets[] = [
        'id' => (int) $post->ID,
        'name' => $post->post_title,
        'slug' => $post->post_name,
        'status' => $post->post_status,
        'price' => get_post_meta($post->ID, '_wcpp_set_price', true),
        'price_type' => get_post_meta($post->ID, '_wcpp_set_price_type', true),
        'apply_all' => (bool) get_post_meta($post->ID, '_wcpp_apply_all', true),
        'priority' => (int) get_post_meta($post->ID, '_wcpp_priority', true),
        'assigned_category_ids' => $assigned_category_ids,
        'assigned_categories' => $categories,
        'assigned_products' => $assigned_products,
        'placements' => $placements,
    ];
}

$all_image_ids = array_values(array_unique(array_filter($all_image_ids)));
$images = [];
foreach ($all_image_ids as $id) {
    $file = (string) get_post_meta($id, '_wp_attached_file', true);
    $meta = wp_get_attachment_metadata($id);
    $path = $file ? trailingslashit(wp_get_upload_dir()['basedir']) . $file : null;
    $images[] = [
        'attachment_id' => $id,
        'filename' => $file ? wp_basename($file) : null,
        'relative_path' => $file ?: null,
        'source_path' => $path,
        'url' => wp_get_attachment_url($id),
        'width' => is_array($meta) && isset($meta['width']) ? (int) $meta['width'] : null,
        'height' => is_array($meta) && isset($meta['height']) ? (int) $meta['height'] : null,
        'filesize' => $path && file_exists($path) ? filesize($path) : null,
        'mime_type' => get_post_mime_type($id),
    ];
}

$raw_settings = get_option('wcpp_settings', []);
$settings = [];
foreach (['design', 'behaviour'] as $group) {
    if (isset($raw_settings[$group]) && is_array($raw_settings[$group])) {
        $settings[$group] = $raw_settings[$group];
    }
}

$payload = [
    'schema_version' => 1,
    'generated_at' => gmdate('c'),
    'source' => [
        'platform' => 'WordPress + WooCommerce',
        'site_url' => get_site_url(),
        'plugin_slug' => 'wc-personalisation-panel',
        'plugin_name' => $plugin_data['Name'] ?? null,
        'plugin_version' => $plugin_data['Version'] ?? null,
        'read_only' => true,
    ],
    'feature_reference' => 'docs/FUNCTIONAL-REQUIREMENTS.md, Product personalisation (§4)',
    'set_count' => count($sets),
    'sets' => $sets,
    'public_configuration' => [
        'settings' => $settings,
        'design_keys' => array_keys($settings['design'] ?? []),
        'behaviour_keys' => array_keys($settings['behaviour'] ?? []),
    ],
    'images' => $images,
    'excluded_private_data' => [
        'customer records',
        'orders and order item personalisation values',
        'cart and session data',
        'users and capabilities',
        'licence keys, update tokens, and remote update-check responses',
        'plugin logs and diagnostics',
    ],
];

$json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if (false === $json || false === file_put_contents($out_path, $json . "\n")) {
    fwrite(STDERR, "Cannot write personalisation export.\n");
    exit(1);
}

echo json_encode([
    'sets' => count($sets),
    'products' => array_sum(array_map(function ($set) { return count($set['assigned_products']); }, $sets)),
    'placements' => array_sum(array_map(function ($set) { return count($set['placements']); }, $sets)),
    'images' => count($images),
    'settings_groups' => array_keys($settings),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
