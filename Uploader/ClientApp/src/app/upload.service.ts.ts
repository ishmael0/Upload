import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpEvent, HttpRequest, HttpHandler } from '@angular/common/http';

export enum Status {
  Stop,
  Error,
  Play,
  Pause,
  Done
}

export class ItemsToUpload {
  public percent() {
    if (this.status == Status.Done) {
      return 100;
    }
    else if (this.jobs.length == 0) {
      return 0;
    }
    else return (this.chunkCount - this.jobs.length) / this.chunkCount * 100;
  }
  public status: Status;
  public name: string;
  public dest: string;
  public chunkCount: number;
  public jobs: any[];
  public file: File;
  public id: number;
  constructor(name: string, file: File, dest: string) {
    this.file = file;
    this.status = Status.Pause;
    this.name = name;
    this.dest = dest;
    this.jobs = [];
  }
  public init() {
    let chunkSize = 2 * 1024 * 1024;
    this.jobs = [];
    let fileSize = this.file.size;
    let chunkCount = fileSize / chunkSize;
    for (let i = 0; i <= chunkCount; i++) {
      var blob = this.file.slice(i * chunkSize, (i + 1) * chunkSize);
      var formData = new FormData();
      formData.append("fileName", this.file.name);
      formData.append("dest", this.dest);
      formData.append("file", blob);
      formData.append("chunkIndex", i.toString());
      formData.append("chunkCount", (Math.trunc(chunkCount)).toString());
      formData.append("fileSize", fileSize.toString());
      this.jobs.push(formData);
    }
    this.chunkCount = this.jobs.length;
    this.status = Status.Pause;
  }

}


@Injectable() export class UploadManagerService {
  constructor(public httpClient: HttpClient) { this.lastId = 0 }
  private lastId = 0;
  public tasks: ItemsToUpload[] = [];
  public createTask(file: File, dest: string, id: number) {
    if (file == undefined) {
      return null;
    }
    else if (file.size > 200 * 1024 * 1024) {
      console.log('File is over the limit, limit is 200MB');

      return null;
    }
    else if (this.tasks.filter(c => c.name == file.name).length > 0) {
      console.log( 'File is uploading');
      return null;
    }
    else {
      let task = new ItemsToUpload(file.name, file, "");
      task.init();
      if (id != 0) {
        task.id = this.lastId++;
      }
      return task;
    }
  }
  public addTask(file: File, dest: string = '') {
    let task = this.createTask(file, dest, 0);
    if (task != null) {
      this.tasks.push(task);
    }
  }
  public refreshTask(task: ItemsToUpload) {
    task.init();
  }
  public async pause(task: ItemsToUpload) { task.status = Status.Pause; }
  public async retry(task: ItemsToUpload) { task.init(); }
  public async stop(task: ItemsToUpload) { task.status = Status.Stop; this.deleteFromServer(task); task.jobs = []; }
  public async deleteFromServer(task: ItemsToUpload) {
    task.status = Status.Stop;
    task.jobs = [];
    var formData = new FormData();
    formData.append("fileName", task.name);
    formData.append("dest", task.dest);
    let text = await this.HTTPRequest("api/Uploader/DeleteUnCompletedUpload", formData);
  }
  public async delete(task: ItemsToUpload) {
    for (var i = 0; i < this.tasks.length; i++) {
      if (task == this.tasks[i]) {
        this.tasks.splice(i, 1);
        return;
      }
    }
  }
  public async play(task: ItemsToUpload) {
    if (task.jobs.length == 0) {
      task.status = Status.Done;
      return;
    }
    task.status = Status.Play;
    while (task.jobs.length > 0) {
      if (task.status == Status.Play) {
        let formData = task.jobs.shift();
        let text = await this.HTTPRequest("api/Uploader/upload", formData);
        if (text == null) {
          task.jobs.unshift(formData);
          task.status = Status.Error;
          break;
        }
        else {

        }
      }
      else {
        break;
      }
    }
    if (task.jobs.length == 0) {
      task.status = Status.Done;
    }
  }
  async HTTPRequest(url: string, formData: any) {
    return await this.httpClient.post(url, formData)
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
    }
}
