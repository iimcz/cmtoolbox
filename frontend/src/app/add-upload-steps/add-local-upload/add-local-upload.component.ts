import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FileClient, FileResponse, UploadProgress } from 'src/app/services/api';

@Component({
  selector: 'app-add-local-upload',
  templateUrl: './add-local-upload.component.html',
  styleUrls: ['./add-local-upload.component.css']
})
export class AddLocalUploadComponent implements OnInit {
  @Input() accept!: string;
  @Input() showPreview: boolean = false;
  @Input() packageId!: number;

  uploadedFiles: UploadedFile[] = [];

  constructor(
    private fileClient: FileClient
  ) { }

  ngOnInit(): void {
  }

  handleFileInput(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    const elem = event.target as HTMLInputElement;

    const file = elem.files?.item(0);
    console.log("Sending file: " + file?.name);
    if (file) {
      this.fileClient.upload(file, this.packageId).subscribe((value: FileResponse | UploadProgress) => {
        if (value instanceof FileResponse) {
          this.uploadedFiles.push(
            {
              id: value.id!,
              thumbUrl: value.thumbnail!,
              filename: value.filename!,
              uploadComplete: true
            }
          )
        } else {
          let progress = value as UploadProgress;
          if (progress)
            console.log("Got progress: " + progress.uploaded / progress.total);
        }
      })
    }
  }

  deleteFile(file: UploadedFile) {
    this.fileClient.delete(file.id).subscribe(() => {
      const index = this.uploadedFiles.findIndex((val) => val === file);
      this.uploadedFiles.splice(index, 1);
    });
  }
}
export interface UploadedFile {
  id: number;
  thumbUrl: string;
  filename: string;
  uploadComplete: boolean;
}