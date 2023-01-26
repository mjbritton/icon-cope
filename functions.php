<?php
add_action('wp_enqueue_scripts', 'mjb_enqueue_styles');
function mjb_enqueue_styles()
{
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
}

function theme_files()
{

    if (strstr($_SERVER['SERVER_NAME'], 'icon-cope.dev')) {
        wp_enqueue_script('main-theme-js', 'http://192.168.0.2:3000/bundled.js', null, '1.1', true);
    } else {
        wp_enqueue_script('our-vendors-js', get_theme_file_uri('/bundled-assets/undefined'), null, '1.0', true);
        wp_enqueue_script('main-theme-js', get_theme_file_uri('/bundled-assets/scripts.31d6cfe0d16ae931b73c.js'), null, '1.0', true);
        wp_enqueue_style('our-main-styles', get_theme_file_uri('/bundled-assets/styles.45673ffefa4775d0aecc.css'));
    }

    wp_localize_script('main-theme-js', 'themeData', array(
        'root_url' => get_site_url(),
        'nonce'    => wp_create_nonce('wp_rest'),
    ));
}

add_action('wp_enqueue_scripts', 'theme_files');

// Allow SVG
add_filter('wp_check_filetype_and_ext', function ($data, $file, $filename, $mimes) {
    global $wp_version;
    if ($wp_version !== '4.7.1') {
        return $data;
    }
    $filetype = wp_check_filetype($filename, $mimes);
    return [
        'ext'             => $filetype['ext'],
        'type'            => $filetype['type'],
        'proper_filename' => $data['proper_filename'],
    ];
}, 10, 4);
function cc_mime_types($mimes)
{
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
}
add_filter('upload_mimes', 'cc_mime_types');
function fix_svg()
{
    echo '';
}
add_action('admin_head', 'fix_svg');

// post title shortcode
function post_title_shortcode()
{
    global $post;
    return $post->post_title;
}
add_shortcode('post_title', 'post_title_shortcode');