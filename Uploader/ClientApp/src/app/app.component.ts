import { Component, ViewChild, ElementRef } from '@angular/core';
import { UploadManagerService, Status } from './upload.service.ts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  jobs: any[] = [];
  @ViewChild('inputFile') inputFile: ElementRef;
  getStatus(s: Status) {
    return Status[s];
  }
  constructor(public uploadManagerService: UploadManagerService) {  }
  async upload(event) {
    for (var i = 0; i < event.target.files.length; i++) {
      this.uploadManagerService.addTask(event.target.files[i]);
    }
  }
}
