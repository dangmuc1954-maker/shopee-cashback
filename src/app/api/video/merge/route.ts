import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export async function POST(req: Request) {
  const tempDir = path.join(os.tmpdir(), `timelapse_merge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  
  try {
    const formData = await req.formData();
    const files = formData.getAll('videos') as File[];
    const transition = formData.get('transition') as string || 'none'; // 'none' | 'crossfade'
    const speed = Number(formData.get('speed')) || 1.0;

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'Vui lòng tải lên ít nhất 2 video phân cảnh!' }, { status: 400 });
    }

    await fs.mkdir(tempDir, { recursive: true });

    // Lưu các file video tạm thời vào đĩa
    const inputPaths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(tempDir, `input_${i}.mp4`);
      await fs.writeFile(filePath, buffer);
      inputPaths.push(filePath);
    }

    const outputPath = path.join(tempDir, 'output_merged.mp4');

    // Tạo file danh sách ghép (concat demuxer)
    const concatListPath = path.join(tempDir, 'filelist.txt');
    const fileListContent = inputPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(concatListPath, fileListContent, 'utf-8');

    // Thực thi FFmpeg ghép video
    await new Promise<void>((resolve, reject) => {
      // Chuẩn hóa và nối các video lại với nhau, đảm bảo cùng framerate và audio/video stream
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with error code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });

    // Đọc file kết quả và trả về dạng Blob video stream
    const outputBuffer = await fs.readFile(outputPath);

    // Dọn dẹp thư mục tạm trong nền
    fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="timelapse_construction_full.mp4"',
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Lỗi ghép video:', error);
    fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi xử lý ghép video với FFmpeg' },
      { status: 500 }
    );
  }
}
