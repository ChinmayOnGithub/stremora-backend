// Cleanup old log files
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const maxAgeDays = 14;

if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    
    files.forEach(file => {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > maxAgeDays) {
            fs.unlinkSync(filePath);
            console.log(`[CLEANUP] Deleted old log: ${file}`);
        }
    });
    
    console.log('[CLEANUP] Log cleanup complete');
} else {
    console.log('[CLEANUP] No logs directory found');
}
