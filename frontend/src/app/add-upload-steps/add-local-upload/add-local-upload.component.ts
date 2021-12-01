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

  uploadedFiles = TEST_UPLOADED;

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
              thumbUrl: "https://picsum.photos/101/101",
              filename: file?.name ?? "unknown",
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

}

const TEST_UPLOADED: UploadedFile[] = [
  { thumbUrl: "https://picsum.photos/100/100", filename: "img1.jpg", uploadComplete: true },
  { thumbUrl: "https://picsum.photos/100/100", filename: "img1.jpg", uploadComplete: false }
];



export interface UploadedFile {
  thumbUrl: string;
  filename: string;
  uploadComplete: boolean;
}