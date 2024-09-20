import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  @ViewChild('typingText') typingTextElement!: ElementRef;
  showPassword: boolean = false;

  ngAfterViewInit(): void {
    this.startTyping();
  }

  startTyping(): void {
    const element = this.typingTextElement.nativeElement;
    const words = element.getAttribute('words')?.split(',') || [];
    const typingSpeed = parseInt(element.getAttribute('typing-speed') || '50', 10);
    const typingDelay = parseInt(element.getAttribute('typing-delay') || '1000', 10);

    this.typeWords(element, words, typingSpeed, typingDelay);
  }

  typeWords(element: HTMLElement, words: string[], speed: number, delay: number, index = 0): void {
    if (index < words.length) {
      const word = words[index];
      const timeout = speed * word.length;

      setTimeout(() => {
        element.textContent = word;
        setTimeout(() => {
          element.textContent += '|'; // Cursor
          this.typeWords(element, words, speed, delay, index + 1);
        }, delay);
      }, timeout);
    }
  }

  constructor() {
    document.getElementById('signUpComponent')!.style.display = "none";
    document.getElementById('secondDashboardComponent')!.style.display = "block";
  }

  togglePasswordVisibility(event: Event) {
    event.preventDefault(); // Prevent default button behavior
    this.showPassword = !this.showPassword;
  }
}
