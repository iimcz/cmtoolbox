import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FileClient, FileResponse, UploadProgress } from 'src/app/services/api';
import { PackagesClient } from 'src/app/services/api.generated.service';

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

  uploading: boolean = false;
  uploadProgress: number = 0;

  constructor(
    private fileClient: FileClient,
    private packagesClient: PackagesClient
  ) { }

  ngOnInit(): void {
    this.uploading = true;

    this.packagesClient.getUnfinishedPackageFiles(this.packageId).subscribe(files => {
      for (let file of files) {
        this.uploadedFiles.push({
          id: file.id!,
          thumbUrl: this.fileClient.getFileThumbnailUrl(file.id!),
          filename: file.filename!
        })
      }
      this.uploading = false;
    });
  }

  handleFileInput(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    const elem = event.target as HTMLInputElement;

    const file = elem.files?.item(0);
    console.log("Sending file: " + file?.name);
    if (file) {
      this.uploading = true;
      this.uploadProgress = 0;
      this.fileClient.upload(file, this.packageId).subscribe((value: FileResponse | UploadProgress) => {
        if (value instanceof FileResponse) {
          this.uploadedFiles.push(
            {
              id: value.id!,
              thumbUrl: this.fileClient.getFileThumbnailUrl(value.id!),
              filename: value.filename!
            }
          )
          this.uploading = false;
        } else if (value instanceof UploadProgress) {
          let progress = value as UploadProgress;
          this.uploadProgress = 100 * progress.uploaded! / progress.total!;
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
}