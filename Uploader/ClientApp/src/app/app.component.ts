import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  jobs: any[] = [];
  @ViewChild('inputFile') inputFile: ElementRef;
  constructor(public http: HttpClient) {  }
  async upload(event) {
    this.CreateTasks(event.target.files[0]);
  }
  CreateTasks(file: File) {
    let chunkSize = 2 * 1024 * 1024;
    let dest = "my folder//";
    this.jobs = [];
    let fileSize = file.size;
    let chunkCount = fileSize / chunkSize;
    for (let i = 0; i <= chunkCount; i++) {
      var blob = file.slice(i * chunkSize, (i + 1) * chunkSize);
      var formData = new FormData();
      formData.append("fileName", file.name);
      formData.append("dest", dest);
      formData.append("file", blob);
      formData.append("chunkIndex", i.toString());
      formData.append("chunkCount", (Math.trunc(chunkCount)).toString());
      formData.append("fileSize", fileSize.toString());
      this.jobs.push(formData);
    }
    this.uploadToServer();
  }
  async uploadToServer() {
    while (this.jobs.length > 0) {

      let formData = this.jobs.shift();

     let res = await this.http.post('/api/Uploader/upload', formData)
        .toPromise().then(
          (response: any) => {
            if (response == 200) {
              return true;
            }
            else {
              return false;
            }
          }
      );
      if (res) {
      }
      else {
        break;
      }
    }
  }
}
