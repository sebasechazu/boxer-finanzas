import { Component, inject, computed, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

/**
 * Avatar reutilizable que muestra:
 * - La foto de Google si está disponible
 * - La inicial del nombre/email en un círculo con color derivado del email
 *
 * No requiere Firebase Storage.
 */
@Component({
    selector: 'app-avatar',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="avatar-wrapper rounded-full overflow-hidden shrink-0 inline-flex" [style.width.px]="size" [style.height.px]="size">
            @if (photoURL()) {
                <img [src]="photoURL()!" [alt]="initial()" class="w-full h-full object-cover block" />
            } @else {
                <div class="w-full h-full flex items-center justify-center font-bold text-white tracking-tighter select-none"
                     [style.background]="color()"
                     [style.fontSize.px]="size * 0.4">
                    {{ initial() }}
                </div>
            }
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager
})
export class AvatarComponent {
    private authService = inject(AuthService);

    /** Tamaño en px (ancho y alto del círculo). Por defecto: 36 */
    @Input() size = 36;

    /** Opcional: forzar un email/nombre específico (para avatares de otros usuarios) */
    @Input() email?: string;
    @Input() name?: string;
    @Input() photo?: string;

    readonly photoURL = computed(() => {
        // Si se provee desde afuera, usar eso; si no, usar el usuario logueado
        if (this.photo !== undefined) return this.photo || null;
        return this.authService.userSignal()?.photoURL ?? null;
    });

    readonly initial = computed(() => {
        if (this.name) return this.name.charAt(0).toUpperCase();
        if (this.email) return this.email.charAt(0).toUpperCase();
        const user = this.authService.userSignal();
        if (!user) return '?';
        const fuente = user.displayName || user.email || '?';
        return fuente.charAt(0).toUpperCase();
    });

    readonly color = computed(() => {
        const str = this.email ?? this.authService.userSignal()?.email ?? '';
        return AvatarComponent.colorFromString(str);
    });

    /** Genera un color HSL consistente basado en un hash simple del string */
    static colorFromString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 65%, 45%)`;
    }
}
