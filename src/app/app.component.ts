import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Amplify from '@aws-amplify/core';
import awsExports from '../../src/aws-exports';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Stampa-Solutions-Staff-Augmentation';
  @ViewChild('typingText') typingTextElement: ElementRef | undefined;

  wordsToType: string[] = [];
  currentWordIndex: number = 0;

  currentCharacterIndex: number = 0;
  typingSpeed: number = 70;
  
  typingDelay: number = 1000;
  typingTimer: any;

  constructor() {
    Amplify.configure(awsExports);
  }

  ngOnInit() {
    document.getElementById('signUpComponent')!.style.display = "block";
    document.getElementById('secondDashboardComponent')!.style.display = "none";
  }

  ngAfterViewInit(): void {
    const typerElement = this.typingTextElement?.nativeElement;

    if (typerElement) {
      this.wordsToType = typerElement.getAttribute('words')?.split(',') || [];
      this.typingSpeed = parseInt(typerElement.getAttribute('typing-speed') || '70', 10);
      this.typingDelay = parseInt(typerElement.getAttribute('typing-delay') || '1000', 10);

      this.type();
    }
  }

  type(): void {
    const wordToType = this.wordsToType[this.currentWordIndex % this.wordsToType.length];
    const typerElement = this.typingTextElement?.nativeElement;

    if (typerElement && this.currentCharacterIndex < wordToType.length) {
      typerElement.innerHTML += wordToType[this.currentCharacterIndex++];
      this.typingTimer = setTimeout(() => this.type(), this.typingSpeed);
    } else {
      this.typingTimer = setTimeout(() => this.erase(), this.typingDelay);
    }
  }

  erase(): void {
    const wordToType = this.wordsToType[this.currentWordIndex % this.wordsToType.length];
    const typerElement = this.typingTextElement?.nativeElement;

    if (typerElement && this.currentCharacterIndex > 0) {
      typerElement.innerHTML = wordToType.substring(0, --this.currentCharacterIndex);
      this.typingTimer = setTimeout(() => this.erase(), this.typingSpeed);
    } else {
      this.currentWordIndex++;
      this.typingTimer = setTimeout(() => this.type(), this.typingDelay);
    }
  }

  public formFields = {
    signUp: {
      email: {
        order: 2
      },
      password: {
        order: 4
      },
      confirm_password: {
        order: 5,
      },
      phone_number: {
        order: 3,
        dialCodeList: ['+1', '+92']
      },
      name: {
        order: 1,
      }
    },
  }
}
