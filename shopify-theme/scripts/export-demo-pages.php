<?php
/**
 * Read-only re-extraction of the public information-page sources.
 *
 * Run from the WordPress root:
 *   wp --allow-root eval-file /home/vjranga/Documents/2202/shopify-theme/scripts/export-demo-pages.php > /tmp/demo-pages-raw.json
 *
 * Emits to stdout: title, slug, status, Elementor source JSON (_elementor_data)
 * and the published contact form field list (Fluent Form 1). The database is
 * only read. No page is written, no form is submitted, and no customer, order,
 * or submission data is exported.
 *
 * The committed demo file html-demo/assets/pages-data.json is hand-sanitized
 * from this raw source (Elementor/theme wrappers, WP classes, scripts, and
 * localhost URLs removed; links converted to demo routes, tel:, and mailto:
 * per docs/PAGE-CONTENT.md). This script exists so the raw source can be
 * re-derived to re-check that provenance.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run through wp eval-file.\n");
    exit(1);
}

$page_ids = [4400, 4439, 29129, 29131, 29133, 29127];
$pages_out = [];

foreach ($page_ids as $pid) {
    $post = get_post($pid);
    if (!$post || $post->post_type !== 'page') {
        $pages_out[] = ['id' => $pid, 'error' => 'page not found'];
        continue;
    }
    $pages_out[] = [
        'id' => (int) $post->ID,
        'title' => $post->post_title,
        'slug' => $post->post_name,
        'status' => $post->post_status,
        'modified' => $post->post_modified_gmt,
        'elementorSource' => get_post_meta($post->ID, '_elementor_data', true),
        'template' => get_post_meta($post->ID, '_wp_page_template', true),
    ];
}

$form_out = [];
$form_out = [];
// Fluent Forms stores forms in wp_fluentform_forms (single row per form, JSON in form_fields).
// The JSON layout is { fields: [...], submitButton: { settings: { button_ui: { text } } } }.
global $wpdb;
$rows = $wpdb->get_results(
    "SELECT id, title, status, form_fields FROM {$wpdb->prefix}fluentform_forms WHERE id = 1",
    ARRAY_A
);
foreach ((array) $rows as $row) {
    $form_json = json_decode($row['form_fields'], true);
    $fields = is_array($form_json) && isset($form_json['fields']) ? $form_json['fields'] : [];
    $flat = [];
    foreach ($fields as $field) {
        $element = $field['element'] ?? '';
        // Name field packages first/middle/last in a settings.fields sub-map.
        if ($element === 'input_name' && isset($field['fields']) && is_array($field['fields'])) {
            foreach ($field['fields'] as $sub_key => $sub) {
                if (!($sub['settings']['visible'] ?? true)) { continue; }
                $flat[] = [
                    'type' => $sub_key === 'middle_name' ? null : $sub_key,
                    'label' => $sub['settings']['label'] ?? '',
                ];
            }
            continue;
        }
        if ($element === 'container' || $element === 'custom_html') { continue; }
        $flat[] = [
            'type' => $element,
            'name' => $field['attributes']['name'] ?? '',
            'label' => $field['settings']['label'] ?? '',
        ];
    }
    $submit_text = '';
    if (isset($form_json['submitButton']['settings']['button_ui']['text'])) {
        $submit_text = $form_json['submitButton']['settings']['button_ui']['text'];
    }
    $form_out = [
        'formId' => (int) $row['id'],
        'title' => $row['title'],
        'status' => $row['status'],
        'submitText' => $submit_text,
        'fields' => $flat,
    ];
}

echo json_encode([
    'generatedAt' => gmdate('c'),
    'note' => 'Read-only source extraction for html-demo/assets/pages-data.json; sanitized demo file is the canonical demo copy.',
    'pages' => $pages_out,
    'contactForm' => $form_out,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
