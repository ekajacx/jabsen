"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number; // Lapisan kedalaman 3D: 0.2 (jauh) s/d 1.0 (dekat)
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  blur: number;
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Posisi Mouse
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 170, // Radius jangkauan koneksi mouse
    };

    // Konfigurasi Partikel: Lebih sedikit & lapang (Depth of Field)
    const particleCount = Math.min(48, Math.max(28, Math.floor((width * height) / 28000)));
    const connectionDistance = 135;
    const particles: Particle[] = [];

    // Brand blue: RGB 70, 95, 255 (#465fff)
    const brandColor = { r: 70, g: 95, b: 255 };

    // Inisialisasi Partikel dengan Simulasi Kedalaman 3D (Z-axis / Parallax)
    for (let i = 0; i < particleCount; i++) {
      // z bernilai 0.25 (paling jauh) hingga 1.0 (paling dekat)
      const z = Math.random() * 0.75 + 0.25;

      // Partikel jauh (z kecil): radius kecil, blur tinggi, opacity rendah, gerakan lambat
      // Partikel dekat (z besar): radius besar, tajam, opacity tinggi, gerakan normal
      const radius = z * 2.8 + 0.8; // rentang ~1.2px sampai ~3.6px
      const baseAlpha = z * 0.5 + 0.15; // rentang 0.25 s/d 0.65
      const blur = (1 - z) * 6; // partikel jauh memiliki blur hingga 6px

      // Kecepatan sangat tenang & lambat (0.2 - 0.35 px/frame)
      const speed = (Math.random() * 0.18 + 0.12) * z;
      const angle = Math.random() * Math.PI * 2;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        baseAlpha,
        blur,
      });
    }

    // Urutkan berdasarkan z agar partikel jauh digambar lebih dulu (z-sorting)
    particles.sort((a, b) => a.z - b.z);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Gambar Garis Koneksi Antar Partikel (Synaptic Bridges)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            // Garis lebih tipis & halus jika salah satu atau keduanya di layer jauh
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = (1 - dist / connectionDistance) * 0.22 * avgZ;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${brandColor.r}, ${brandColor.g}, ${brandColor.b}, ${alpha})`;
            ctx.lineWidth = 0.6 * avgZ + 0.3;
            ctx.stroke();
          }
        }

        // Interaksi Mouse Hover: Menghubungkan partikel ke kursor mouse
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mouseDist < mouse.radius) {
          const mouseAlpha = (1 - mouseDist / mouse.radius) * 0.7 * p1.z;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${brandColor.r}, ${brandColor.g}, ${brandColor.b}, ${mouseAlpha})`;
          ctx.lineWidth = 1.2 * p1.z;
          ctx.stroke();

          // Efek magnetik lembut (partikel dekat merespon lebih kuat)
          p1.x += (mouse.x - p1.x) * 0.008 * p1.z;
          p1.y += (mouse.y - p1.y) * 0.008 * p1.z;
        }
      }

      // 2. Gambar Dots dengan Efek Depth of Field (Blur untuk partikel jauh)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gerak perlahan & halus
        p.x += p.vx;
        p.y += p.vy;

        // Pantul batas layar
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Jika partikel jauh: berikan shadowBlur agar tampak bokeh / out-of-focus
        if (p.blur > 1) {
          ctx.shadowColor = `rgba(${brandColor.r}, ${brandColor.g}, ${brandColor.b}, ${p.baseAlpha * 0.8})`;
          ctx.shadowBlur = p.blur;
        } else {
          // Partikel dekat: pendar tajam
          ctx.shadowColor = `rgba(${brandColor.r}, ${brandColor.g}, ${brandColor.b}, 0.6)`;
          ctx.shadowBlur = 3;
        }

        ctx.fillStyle = `rgba(${brandColor.r}, ${brandColor.g}, ${brandColor.b}, ${p.baseAlpha})`;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-1000"
    />
  );
}
