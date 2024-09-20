import { Component } from '@angular/core';
import { Amplify, Auth } from 'aws-amplify';
import awsExports from '../../aws-exports';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor() {
    Amplify.configure(awsExports);
    document.getElementById('signUpComponent')!.style.display = "none";
    document.getElementById('secondDashboardComponent')!.style.display = "block";
  }

  togglePasswordVisibility(event: Event) {
    event.preventDefault(); // Prevent default button behavior
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(event: Event) {
    event.preventDefault(); // Prevent default button behavior
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async handleSignUp(formData: Record<string, any>) {
    let { username, password, attributes } = formData;
    username = username.toLowerCase();
    attributes.email = attributes.email.toLowerCase();
    return Auth.signUp({
      username,
      password,
      attributes,
      autoSignIn: {
        enabled: true,
      },
    });
  }
}
