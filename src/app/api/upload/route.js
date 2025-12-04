// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
  try {
    const { file } = await request.json();
    
    // Upload para Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: 'assinaturas', // Pasta no Cloudinary
      transformation: [
        { width: 400, height: 150, crop: 'limit' }, // Redimensiona
        { quality: 'auto:eco' }, // Comprime automaticamente
        { format: 'webp' } // Converte para WebP (menor tamanho)
      ]
    });
    
    return NextResponse.json({ 
      success: true, 
      url: uploadResponse.secure_url 
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao fazer upload' 
    }, { status: 500 });
  }
}