import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfileServiceService {
  profilePictureData: any;
  agentSharedData: any

  constructor() { }

  setSharedVariable(value: any) {
    this.profilePictureData = value;
  }

  getSharedVariable(): Promise<any> {
    if (this.profilePictureData !== undefined) {
      return Promise.resolve(this.profilePictureData);
    } else {
      return Promise.resolve(null);
    }
  }

  setSharedAgent(value: any) {
    this.agentSharedData = value;
  }

  getSharedAgent(): Promise<any> {
    if (this.agentSharedData !== undefined) {
      return Promise.resolve(this.agentSharedData);
    } else {
      return Promise.resolve(null);
    }
  }
}
