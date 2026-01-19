
import React, { useEffect, useRef } from 'react';

export const EasterEggApp = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 800;
    let height = canvas.height = canvas.parentElement?.clientHeight || 600;

    let particles: Particle[] = [];
    const colors = ['#00fffc', '#fc00ff', '#fffc00', '#00ff00'];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 100;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 5 + 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 1.5;
        this.size *= 0.95;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 800;
      height = canvas.height = canvas.parentElement?.clientHeight || 600;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        let x, y;
        
        if ('touches' in e) {
             x = e.touches[0].clientX - rect.left;
             y = e.touches[0].clientY - rect.top;
        } else {
             x = (e as MouseEvent).clientX - rect.left;
             y = (e as MouseEvent).clientY - rect.top;
        }

        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(x, y));
        }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
    };
  }, []);

  return (
    <div className="w-full h-full bg-black overflow-hidden relative cursor-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-4xl font-bold select-none pointer-events-none">
        MOVE YOUR MOUSE
      </div>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
