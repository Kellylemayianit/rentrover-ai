/**
 * pages/login.js — admin login gate. Submission handled via
 * data-action="submit-login" delegated in app.js.
 */

export function renderLoginPage(root) {
  root.innerHTML = `
    <div class="login-shell" data-component="login-page">
      <div class="login-card">
        <div class="login-card__logo">🧭</div>
        <h1 class="login-card__title display-md text-center">Admin Login</h1>
        <p class="login-card__sub">Sign in to manage RentRover AI listings.</p>
        <form data-action="submit-login">
          <div class="form-field">
            <label for="login-email">Email</label>
            <input id="login-email" name="email" type="email" required value="admin@rentrover.ai">
          </div>
          <div class="form-field">
            <label for="login-password">Password</label>
            <input id="login-password" name="password" type="password" required value="demo1234">
          </div>
          <button type="submit" class="btn btn--primary btn--block">Sign in</button>
        </form>
        <p class="login-card__hint">Demo credentials are pre-filled — this is a mock login for prototyping.</p>
      </div>
    </div>
  `;
}
