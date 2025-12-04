import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * Extract video metadata (duration, dimensions, format, etc.)
 * @param {string} videoPath - Path to video file
 * @returns {Promise<Object>} Video metadata
 */
export const getVideoMetadata = (videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                console.error('FFprobe error:', err);
                reject(err);
                return;
            }

            try {
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

                const duration = metadata.format.duration || 0;
                const minutes = Math.floor((duration % 3600) / 60);
                const seconds = Math.floor(duration % 60);
                const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

                const result = {
                    duration: duration, // in seconds
                    formattedDuration: formattedDuration, // "MM:SS"
                    width: videoStream?.width || 0,
                    height: videoStream?.height || 0,
                    format: metadata.format.format_name || 'unknown',
                    size: metadata.format.size || 0, // in bytes
                    bitrate: metadata.format.bit_rate || 0,
                    codec: videoStream?.codec_name || 'unknown',
                    fps: videoStream?.r_frame_rate || '0/0',
                    hasAudio: !!audioStream,
                };

                resolve(result);
            } catch (parseError) {
                console.error('Error parsing metadata:', parseError);
                reject(parseError);
            }
        });
    });
};

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "0:00";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
};
