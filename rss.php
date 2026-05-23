<?php
$feed_url = "https://note.com/haruto_miyai/rss";
$rss = simplexml_load_file($feed_url);

if ($rss === false) {
    echo "RSSを読み込めませんでした。";
    exit;
}

echo "<div class='grid-container'>"; // ★ grid-containerを適用

$max_articles = 10; // 表示する記事数
$article_count = 0;

foreach ($rss->channel->item as $item) {
    if ($article_count >= $max_articles) break;
    $article_count++;

    $title = (string) $item->title;
    $link = (string) $item->link;
    $date = date("Y/m/d", strtotime((string) $item->pubDate));

    // `<media:thumbnail>` から画像を取得
    $namespaces = $rss->getNamespaces(true);
    if (isset($namespaces['media'])) {
        $media = $item->children($namespaces['media']);
        $thumbnail = isset($media->thumbnail) ? (string) $media->thumbnail : "";
    } else {
        $thumbnail = "";
    }

    // デフォルト画像
    if (empty($thumbnail)) {
        $thumbnail = "nophotos.jpg";
    }

    // `<description>` の中身を取得（HTMLを適切に処理）
    $description = strip_tags((string) $item->description, '<p><br><strong><em>'); // 許可するタグ
    $description = preg_replace('/<a .*?<\/a>/', '', $description); // "続きをみる" のリンクを削除
    $description = trim($description); // 余分なスペースを削除

    echo "<a href='{$link}' target='_blank' class='grid-item'>";
    echo "<img src='{$thumbnail}' alt='{$title}'>";
    echo "<p class='rss-date'>{$date}</p>";
    echo "<h3>{$title}</h3>";
    echo "<p class='rss-description'>{$description}</p>"; // ★ 説明文を追加
    echo "</a>";
}

echo "<a href='https://note.com/haruto_miyai' target='_blank' class='grid-item-1'>";
echo "<h3>全ての記事を見る</h3>";
echo "</a>";

echo "</div>"; // grid-containerの終了
?>
