<?php
/**
 * VidGrb API - Video Download Service
 * Backend API for handling video downloads from multiple platforms
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class VidGrbAPI {
    private $supportedPlatforms = [
        'youtube',
        'tiktok', 
        'facebook',
        'twitter',
        'dailymotion',
        'twitch'
    ];

    private $qualityOptions = [
        'youtube' => ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'],
        'tiktok' => ['360p', '720p'],
        'facebook' => ['240p', '360p', '480p', '720p'],
        'twitter' => ['240p', '360p', '720p'],
        'dailymotion' => ['240p', '360p', '480p', '720p', '1080p'],
        'twitch' => ['360p', '480p', '720p', '1080p']
    ];

    public function __construct() {
        // Initialize logging
        $this->logRequest();
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $query = $_GET;

        try {
            switch ($path) {
                case '/api/':
                case '/api/index.php':
                    $this->handleMainEndpoint($method, $query);
                    break;
                case '/api/info':
                    $this->getVideoInfo($query);
                    break;
                case '/api/download':
                    $this->downloadVideo($query);
                    break;
                case '/api/platforms':
                    $this->getSupportedPlatforms();
                    break;
                case '/api/stats':
                    $this->getStats();
                    break;
                default:
                    $this->sendError('Endpoint not found', 404);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function handleMainEndpoint($method, $query) {
        if ($method === 'GET' && isset($query['url'])) {
            $this->getVideoInfo($query);
        } else {
            $this->sendResponse([
                'message' => 'VidGrb API v1.0',
                'status' => 'active',
                'endpoints' => [
                    '/api/info?url={video_url}' => 'Get video information',
                    '/api/download?platform={platform}&id={video_id}&quality={quality}' => 'Download video',
                    '/api/platforms' => 'Get supported platforms',
                    '/api/stats' => 'Get download statistics'
                ],
                'supported_platforms' => $this->supportedPlatforms
            ]);
        }
    }

    private function getVideoInfo($query) {
        if (!isset($query['url'])) {
            $this->sendError('URL parameter is required', 400);
        }

        $url = filter_var($query['url'], FILTER_SANITIZE_URL);
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            $this->sendError('Invalid URL format', 400);
        }

        $platformInfo = $this->detectPlatform($url);
        if (!$platformInfo) {
            $this->sendError('Platform not supported', 400);
        }

        // Simulate video info retrieval
        $videoInfo = $this->fetchVideoMetadata($url, $platformInfo);
        
        $this->sendResponse([
            'success' => true,
            'data' => $videoInfo
        ]);
    }

    private function downloadVideo($query) {
        $requiredParams = ['platform', 'id', 'quality'];
        foreach ($requiredParams as $param) {
            if (!isset($query[$param])) {
                $this->sendError("Missing parameter: {$param}", 400);
            }
        }

        $platform = strtolower($query['platform']);
        $videoId = $query['id'];
        $quality = $query['quality'];

        if (!in_array($platform, $this->supportedPlatforms)) {
            $this->sendError('Platform not supported', 400);
        }

        if (!in_array($quality, $this->qualityOptions[$platform])) {
            $this->sendError('Quality not available for this platform', 400);
        }

        // Generate download URL
        $downloadUrl = $this->generateDownloadUrl($platform, $videoId, $quality);
        
        // Log download
        $this->logDownload($platform, $videoId, $quality);

        $this->sendResponse([
            'success' => true,
            'download_url' => $downloadUrl,
            'expires_at' => time() + 3600, // 1 hour expiry
            'filename' => $this->generateFilename($platform, $videoId, $quality)
        ]);
    }

    private function getSupportedPlatforms() {
        $this->sendResponse([
            'success' => true,
            'platforms' => array_map(function($platform) {
                return [
                    'name' => $platform,
                    'display_name' => ucfirst($platform),
                    'qualities' => $this->qualityOptions[$platform],
                    'icon' => $this->getPlatformIcon($platform)
                ];
            }, $this->supportedPlatforms)
        ]);
    }

    private function getStats() {
        // In production, these would come from a database
        $stats = [
            'total_downloads' => rand(1200000, 1300000),
            'today_downloads' => rand(8000, 9000),
            'active_users' => rand(1500, 2000),
            'supported_platforms' => count($this->supportedPlatforms),
            'last_updated' => time()
        ];

        $this->sendResponse([
            'success' => true,
            'stats' => $stats
        ]);
    }

    private function detectPlatform($url) {
        $patterns = [
            'youtube' => '/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/',
            'tiktok' => '/(?:tiktok\.com\/@[^\/]+\/video\/|vm\.tiktok\.com\/)(\d+)/',
            'facebook' => '/facebook\.com\/.*\/videos\/(\d+)/',
            'twitter' => '/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/',
            'dailymotion' => '/dailymotion\.com\/video\/([a-zA-Z0-9]+)/',
            'twitch' => '/twitch\.tv\/videos\/(\d+)/'
        ];

        foreach ($patterns as $platform => $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return [
                    'platform' => $platform,
                    'id' => $matches[1],
                    'url' => $url
                ];
            }
        }

        return null;
    }

    private function fetchVideoMetadata($url, $platformInfo) {
        // In production, this would fetch real metadata from the platforms
        // For demo purposes, return mock data
        
        $titles = [
            'youtube' => 'Amazing YouTube Video',
            'tiktok' => 'Trending TikTok Video',
            'facebook' => 'Facebook Video Post',
            'twitter' => 'Twitter Video Tweet',
            'dailymotion' => 'Dailymotion Video Content',
            'twitch' => 'Twitch Video Clip'
        ];

        return [
            'id' => $platformInfo['id'],
            'platform' => $platformInfo['platform'],
            'title' => $titles[$platformInfo['platform']] ?? 'Video Title',
            'description' => 'Video description would be here...',
            'thumbnail' => $this->generateThumbnailUrl($platformInfo['platform'], $platformInfo['id']),
            'duration' => $this->generateRandomDuration(),
            'view_count' => rand(1000, 1000000),
            'upload_date' => date('Y-m-d', strtotime('-' . rand(1, 365) . ' days')),
            'author' => 'Content Creator',
            'qualities' => $this->qualityOptions[$platformInfo['platform']],
            'url' => $url
        ];
    }

    private function generateDownloadUrl($platform, $videoId, $quality) {
        // In production, this would generate actual download URLs
        // For demo, return a placeholder
        return "/downloads/{$platform}/{$videoId}/{$quality}/video.mp4";
    }

    private function generateFilename($platform, $videoId, $quality) {
        $timestamp = date('Y-m-d_H-i-s');
        return "{$platform}_{$videoId}_{$quality}_{$timestamp}.mp4";
    }

    private function generateThumbnailUrl($platform, $videoId) {
        return "https://via.placeholder.com/320x180/8b5cf6/ffffff?text={$platform}+thumbnail";
    }

    private function generateRandomDuration() {
        $minutes = rand(1, 10);
        $seconds = rand(0, 59);
        return sprintf('%d:%02d', $minutes, $seconds);
    }

    private function getPlatformIcon($platform) {
        $icons = [
            'youtube' => '🎥',
            'tiktok' => '🎵',
            'facebook' => '📘',
            'twitter' => '🐦',
            'dailymotion' => '📺',
            'twitch' => '🎮'
        ];

        return $icons[$platform] ?? '📹';
    }

    private function logRequest() {
        // Log API requests for analytics
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];

        // In production, save to database or log file
        error_log('VidGrb API Request: ' . json_encode($logData));
    }

    private function logDownload($platform, $videoId, $quality) {
        // Log downloads for statistics
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'platform' => $platform,
            'video_id' => $videoId,
            'quality' => $quality,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];

        // In production, save to database
        error_log('VidGrb Download: ' . json_encode($logData));
    }

    private function sendResponse($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit();
    }

    private function sendError($message, $status = 400) {
        http_response_code($status);
        echo json_encode([
            'success' => false,
            'error' => $message,
            'status' => $status
        ], JSON_PRETTY_PRINT);
        exit();
    }
}

// Initialize and handle request
$api = new VidGrbAPI();
$api->handleRequest();
?>
