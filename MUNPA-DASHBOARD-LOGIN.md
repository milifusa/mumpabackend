# 🎨 Munpa Dashboard - Login Component

## Colores de la Marca

```scss
$munpa-turquoise: #8fd8d3;  // Turquesa principal
$munpa-pink: #f4b8d3;       // Rosa
$munpa-yellow: #fcde9d;     // Amarillo
$munpa-white: #ffffff;
$munpa-dark: #333333;
$munpa-gray: #666666;
```

---

## 📁 Estructura de Archivos

```
src/
├── assets/
│   └── images/
│       └── munpa-logo.png  <- Coloca tu logo aquí
├── app/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   ├── services/
│   │   └── auth.service.ts
│   └── guards/
│       └── admin.guard.ts
```

---

## 1️⃣ HTML Component

**`login.component.html`**

```html
<div class="login-container">
  <div class="login-card">
    <!-- Logo -->
    <div class="logo-container">
      <img src="assets/images/munpa-logo.png" alt="Munpa Logo" class="logo">
      <h1 class="app-title">Munpa Dashboard</h1>
      <p class="subtitle">Panel de Administración</p>
    </div>

    <!-- Formulario de Login -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email"
          formControlName="email"
          placeholder="admin@munpa.com"
          [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
        <div class="error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
          <span *ngIf="loginForm.get('email')?.errors?.['required']">El email es requerido</span>
          <span *ngIf="loginForm.get('email')?.errors?.['email']">Email inválido</span>
        </div>
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <div class="password-input">
          <input 
            [type]="showPassword ? 'text' : 'password'"
            id="password"
            formControlName="password"
            placeholder="••••••••"
            [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
          <button 
            type="button" 
            class="toggle-password"
            (click)="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <div class="error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
          <span *ngIf="loginForm.get('password')?.errors?.['required']">La contraseña es requerida</span>
          <span *ngIf="loginForm.get('password')?.errors?.['minlength']">Mínimo 6 caracteres</span>
        </div>
      </div>

      <!-- Error del servidor -->
      <div class="alert alert-error" *ngIf="error">
        <span class="alert-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- Botón de Login -->
      <button 
        type="submit" 
        class="btn-login" 
        [disabled]="loading || loginForm.invalid">
        <span *ngIf="!loading">Iniciar Sesión</span>
        <span *ngIf="loading" class="loading-spinner">
          <span class="spinner"></span>
          Iniciando sesión...
        </span>
      </button>
    </form>

    <!-- Footer -->
    <div class="login-footer">
      <p>© 2025 Munpa - Mundo de Papás</p>
    </div>
  </div>
</div>
```

---

## 2️⃣ TypeScript Component

**`login.component.ts`**

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading: boolean = false;
  error: string = '';
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si ya está logueado
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    }

    // Inicializar formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        if (response.success) {
          const user = response.data.user;
          
          // Verificar que sea admin
          if (user.role === 'admin' || user.isAdmin === true) {
            // Guardar token y usuario
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log('✅ Login exitoso como admin');
            
            // Redirigir al dashboard
            this.router.navigate(['/dashboard']);
          } else {
            this.error = 'No tienes permisos de administrador. Este dashboard es solo para administradores de Munpa.';
            console.warn('⚠️ Usuario sin permisos de admin intentó acceder');
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.error = error.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.loading = false;
      }
    });
  }

  // Método para limpiar errores al escribir
  clearError(): void {
    this.error = '';
  }
}
```

---

## 3️⃣ SCSS Styles (Con colores Munpa)

**`login.component.scss`**

```scss
// Colores Munpa
$munpa-turquoise: #8fd8d3;
$munpa-pink: #f4b8d3;
$munpa-yellow: #fcde9d;
$munpa-white: #ffffff;
$munpa-dark: #333333;
$munpa-gray: #666666;
$munpa-light-gray: #f5f5f5;
$munpa-error: #ef4444;

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $munpa-turquoise 0%, $munpa-pink 50%, $munpa-yellow 100%);
  padding: 20px;
}

.login-card {
  background: $munpa-white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: 48px 40px;
  width: 100%;
  max-width: 440px;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    width: 180px;
    height: auto;
    margin-bottom: 20px;
    animation: fadeIn 0.6s ease-out;
  }

  .app-title {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, $munpa-turquoise, $munpa-pink);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 16px;
    color: $munpa-gray;
    margin: 0;
  }
}

.login-form {
  .form-group {
    margin-bottom: 24px;

    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: $munpa-dark;
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.3s ease;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: $munpa-turquoise;
        box-shadow: 0 0 0 4px rgba(143, 216, 211, 0.1);
      }

      &.error {
        border-color: $munpa-error;
      }

      &::placeholder {
        color: #bbb;
      }
    }

    .password-input {
      position: relative;

      .toggle-password {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        padding: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }
      }

      input {
        padding-right: 48px;
      }
    }

    .error-message {
      margin-top: 6px;
      font-size: 13px;
      color: $munpa-error;
      display: flex;
      align-items: center;
      gap: 4px;

      &::before {
        content: '⚠️';
        font-size: 12px;
      }
    }
  }
}

.alert {
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: shake 0.3s ease-out;

  &.alert-error {
    background: #fee;
    border: 1px solid #fcc;
    color: $munpa-error;
  }

  .alert-icon {
    font-size: 20px;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.btn-login {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, $munpa-turquoise, $munpa-pink);
  color: $munpa-white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(143, 216, 211, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(143, 216, 211, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 32px;
  text-align: center;

  p {
    font-size: 13px;
    color: $munpa-gray;
    margin: 0;
  }
}

// Responsive
@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .logo-container {
    .logo {
      width: 150px;
    }

    .app-title {
      font-size: 28px;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

---

## 4️⃣ Auth Service

**`auth.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      uid: string;
      email: string;
      displayName: string;
      role?: string;
      isAdmin?: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'https://mumpabackend.vercel.app';
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<any>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/api/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.data.user) {
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user && (user.role === 'admin' || user.isAdmin === true);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
```

---

## 5️⃣ Admin Guard

**`admin.guard.ts`**

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      return true;
    }

    // Redirigir al login si no está autenticado o no es admin
    console.warn('⚠️ Acceso denegado: Usuario no es admin');
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}
```

---

## 6️⃣ App Module

**`app.module.ts`**

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { AuthService } from './services/auth.service';
import { AdminGuard } from './guards/admin.guard';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    AdminGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## 7️⃣ Global Styles

**`styles.scss`**

```scss
// Colores Munpa
$munpa-turquoise: #8fd8d3;
$munpa-pink: #f4b8d3;
$munpa-yellow: #fcde9d;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Scrollbar personalizado con colores Munpa
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, $munpa-turquoise, $munpa-pink);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, darken($munpa-turquoise, 10%), darken($munpa-pink, 10%));
}
```

---

## ✅ Checklist de Implementación

- [ ] Coloca el logo en `src/assets/images/munpa-logo.png`
- [ ] Crea el componente de login con los archivos proporcionados
- [ ] Crea el servicio de autenticación
- [ ] Crea el guard de admin
- [ ] Configura las rutas en `app-routing.module.ts`
- [ ] Importa `ReactiveFormsModule` y `HttpClientModule` en el módulo
- [ ] Copia los estilos globales en `styles.scss`
- [ ] Haz un usuario admin en Firebase Console
- [ ] Prueba el login con tus credenciales de admin

---

## 🎨 Vista Previa

El login tendrá:
- ✨ Fondo degradado con los colores Munpa (turquesa → rosa → amarillo)
- 🖼️ Logo de Munpa centrado y prominente
- 📝 Formulario con validación en tiempo real
- 🔒 Toggle para mostrar/ocultar contraseña
- ⚡ Animaciones suaves y modernas
- 📱 100% responsive
- 🎯 Diseño profesional y limpio

---

**¡Tu Munpa Dashboard está listo! 🎉**

