import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { TopNavComponent } from './top-nav/top-nav.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardComponent } from './dashboard/dashboard.component';
import { SignUpComponent } from './sign-up/sign-up.component';

import { HomeComponent } from './home/home.component';
import { SignInComponent } from './sign-in/sign-in.component';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { Amplify } from 'aws-amplify';

import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from '@angular/common/http';

import awsconfig from '../../src/aws-exports.js';
import { DatePipe } from '@angular/common';

Amplify.configure(awsconfig);

@NgModule({
  declarations: [
    AppComponent,
    TopNavComponent,
    DashboardComponent,
    SignUpComponent,
    HomeComponent,
    SignInComponent
  ],
  imports: [
    BrowserModule,
    NgbModalModule,
    NgxDropzoneModule,
    AppRoutingModule,
    AmplifyAuthenticatorModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
