import { HamsterSkin, PowerUpState } from '../types/game';

export interface HamsterAnimState {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isGrounded: boolean;
  isRolling: boolean;
  isDoubleJumping: boolean;
  spinAngle: number;
  runCycle: number; // 0 to 2*PI
  invincibleTimer: number; // For hit recovery blink
}

export class HamsterRenderer {
  public static drawHamster(
    ctx: CanvasRenderingContext2D,
    hamster: HamsterAnimState,
    skin: HamsterSkin,
    powerUps: PowerUpState,
    _levelTheme: string = 'cage'
  ) {
    ctx.save();

    // Invincible blink effect
    if (hamster.invincibleTimer > 0) {
      if (Math.floor(hamster.invincibleTimer * 12) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }
    }

    const centerX = hamster.x + hamster.width / 2;
    const centerY = hamster.y + hamster.height / 2;

    ctx.translate(centerX, centerY);

    // If double jumping, rotate around center
    if (hamster.isDoubleJumping) {
      ctx.rotate(hamster.spinAngle);
    }

    // Energy Boost aura
    if (powerUps.energyBoost > 0) {
      this.drawEnergyAura(ctx, 32);
    }

    if (hamster.isRolling) {
      this.drawRollingHamster(ctx, skin, hamster.runCycle);
    } else {
      this.drawRunningHamster(ctx, hamster, skin);
    }

    // Bubble Shield
    if (powerUps.shield) {
      this.drawShield(ctx, 36);
    }

    // Magnet indicator
    if (powerUps.magnet > 0) {
      this.drawMagnetAura(ctx, 34);
    }

    ctx.restore();
  }

  private static drawRunningHamster(
    ctx: CanvasRenderingContext2D,
    hamster: HamsterAnimState,
    skin: HamsterSkin
  ) {
    const { isGrounded, runCycle, vy } = hamster;
    
    // Natural run bobbing
    const bobY = isGrounded ? Math.sin(runCycle * 2) * 2.5 : vy * 0.3;
    const legPhase1 = Math.sin(runCycle);
    const legPhase2 = Math.cos(runCycle);

    // 1. Shadow beneath on ground
    if (isGrounded) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 24, 18 + Math.abs(bobY), 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(0, bobY);

    // 2. Tiny cute hamster tail
    ctx.beginPath();
    ctx.arc(-20, 4, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();

    // 3. Back Legs & Paws
    if (isGrounded) {
      // Back-left leg
      ctx.beginPath();
      ctx.ellipse(-10 + legPhase1 * 5, 18, 5, 4, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fca5a5';
      ctx.fill();

      // Front-left leg
      ctx.beginPath();
      ctx.ellipse(10 - legPhase1 * 5, 18, 5, 4, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fca5a5';
      ctx.fill();
    } else {
      // In air paws spread
      ctx.beginPath();
      ctx.ellipse(-10, 16, 5, 4, 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fca5a5';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, 12, 5, 4, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fca5a5';
      ctx.fill();
    }

    // 4. Chubby Hamster Body (plump teardrop/egg shape)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 2, 21, 19, 0.08, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();

    // Subtle fur highlight gradient
    const furGrad = ctx.createRadialGradient(-4, -6, 2, 0, 2, 22);
    furGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    furGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    furGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    ctx.fillStyle = furGrad;
    ctx.fill();
    ctx.restore();

    // 5. Fluffy Light Belly
    ctx.beginPath();
    ctx.ellipse(3, 7, 14, 12, 0.12, 0, Math.PI * 2);
    ctx.fillStyle = skin.bellyColor;
    ctx.fill();

    // 6. Right side legs (foreground)
    if (isGrounded) {
      // Back-right leg
      ctx.beginPath();
      ctx.ellipse(-8 + legPhase2 * 6, 20, 6, 4.5, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#f87171';
      ctx.fill();

      // Front-right leg
      ctx.beginPath();
      ctx.ellipse(12 - legPhase2 * 6, 20, 6, 4.5, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#f87171';
      ctx.fill();
    }

    // 7. Ears (Left & Right)
    // Left ear (behind)
    ctx.beginPath();
    ctx.ellipse(-8, -17, 7, 6, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-8, -17, 4.5, 4, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = skin.earColor;
    ctx.fill();

    // Right ear (front)
    ctx.beginPath();
    ctx.ellipse(6, -18, 7.5, 6.5, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -18, 5, 4.2, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = skin.earColor;
    ctx.fill();

    // 8. Chubby Cheeks
    ctx.beginPath();
    ctx.arc(11, 4, 9, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();

    // Rosy Blush on Cheek
    ctx.beginPath();
    ctx.arc(11, 6, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.fill();

    // 9. Cute Twitching Whiskers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Top whisker
    ctx.moveTo(17, 1);
    ctx.lineTo(26, -1);
    // Middle whisker
    ctx.moveTo(17, 3);
    ctx.lineTo(28, 4);
    // Bottom whisker
    ctx.moveTo(17, 5);
    ctx.lineTo(25, 9);
    ctx.stroke();

    // 10. Cute Pink Button Nose
    ctx.beginPath();
    ctx.ellipse(19, 2, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();

    // 11. Joyful Smile & Buck Tooth
    ctx.beginPath();
    ctx.arc(16, 5, 3.5, 0.1, Math.PI * 0.9);
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Tiny buck tooth
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 5, 2.5, 2.8);

    // 12. Big Expressive Glossy Eye
    ctx.beginPath();
    ctx.ellipse(10, -4, 4.8, 5.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();

    // Eye catch-lights (cute highlights)
    ctx.beginPath();
    ctx.arc(8.8, -6, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(11.2, -2.5, 0.9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 13. Accessory
    this.drawAccessory(ctx, skin.accessory);
  }

  private static drawRollingHamster(
    ctx: CanvasRenderingContext2D,
    skin: HamsterSkin,
    runCycle: number
  ) {
    ctx.save();
    // Rotate ball texture with speed
    ctx.rotate(runCycle * 1.5);

    // 1. Fur Ball
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = skin.primaryColor;
    ctx.fill();

    // Belly patch rolling
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI);
    ctx.fillStyle = skin.bellyColor;
    ctx.fill();

    // Tucked paws visible during roll
    ctx.beginPath();
    ctx.arc(9, -7, 3.5, 0, Math.PI * 2);
    ctx.arc(-9, 7, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();

    // Rotating fur tufts
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0.2, 1.2);
    ctx.arc(0, 0, 12, 2.4, 3.4);
    ctx.stroke();

    ctx.restore();

    // Dust particles puffing behind roll
    ctx.beginPath();
    ctx.arc(-16, 10, 4, 0, Math.PI * 2);
    ctx.arc(-22, 7, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  }

  private static drawAccessory(ctx: CanvasRenderingContext2D, accessory: HamsterSkin['accessory']) {
    switch (accessory) {
      case 'goggles':
        // Steampunk aviator goggles
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-2, -14, 16, 4);
        // Left lens rim
        ctx.beginPath();
        ctx.arc(3, -12, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -12, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#67e8f9';
        ctx.fill();
        // Right lens rim
        ctx.beginPath();
        ctx.arc(11, -12, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -12, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#67e8f9';
        ctx.fill();
        break;

      case 'cyber_visor':
        // High-tech glowing neon visor
        ctx.beginPath();
        ctx.roundRect(4, -9, 14, 6, [2]);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        // Glow line
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Center digital pip
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(9, -7, 3, 2);
        break;

      case 'astro_helmet':
        // Bubble space helmet
        ctx.beginPath();
        ctx.arc(5, -2, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.28)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Glass sheen arc
        ctx.beginPath();
        ctx.arc(5, -2, 19, -Math.PI * 0.7, -Math.PI * 0.2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        break;

      case 'wizard_hat':
        // Pointed wizard hat
        ctx.save();
        ctx.translate(2, -18);
        ctx.rotate(-0.1);
        // Brim
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#581c87';
        ctx.fill();
        // Cone
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(8, -20);
        ctx.lineTo(8, 0);
        ctx.closePath();
        ctx.fillStyle = '#6b21a8';
        ctx.fill();
        // Star on hat
        ctx.beginPath();
        ctx.arc(3, -9, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.restore();
        break;

      case 'gold_crown':
        // 3-point gold crown
        ctx.save();
        ctx.translate(3, -20);
        ctx.beginPath();
        ctx.moveTo(-8, 3);
        ctx.lineTo(-8, -6);
        ctx.lineTo(-4, -2);
        ctx.lineTo(0, -9);
        ctx.lineTo(4, -2);
        ctx.lineTo(8, -6);
        ctx.lineTo(8, 3);
        ctx.closePath();
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Ruby jewel
        ctx.beginPath();
        ctx.arc(0, -1, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.restore();
        break;

      case 'none':
      default:
        break;
    }
  }

  private static drawEnergyAura(ctx: CanvasRenderingContext2D, radius: number) {
    ctx.save();
    const grad = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.4);
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.25)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Speed fire flickers
    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() * 0.01 + i * 1.5) % (Math.PI * 2);
      const dist = radius * (0.9 + Math.sin(angle * 3) * 0.2);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawShield(ctx: CanvasRenderingContext2D, radius: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Shimmer highlight
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private static drawMagnetAura(ctx: CanvasRenderingContext2D, radius: number) {
    ctx.save();
    const pulse = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius + pulse * 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }
}
