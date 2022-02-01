import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, shareReplay, switchMap } from 'rxjs';
import { ExhibitUploadDialogComponent } from '../dialogs/exhibit-upload-dialog/exhibit-upload-dialog.component';
import { FileClient } from '../services/api';
import { PackageState, PackageMetadata, PackagesClient, PresentationPackage } from '../services/api.generated.service';

@Component({
  selector: 'app-package-detail',
  templateUrl: './package-detail.component.html',
  styleUrls: ['./package-detail.component.css']
})
export class PackageDetailComponent implements OnInit {
  public PackageState = PackageState;
  
  presentationPackage$!: Observable<PresentationPackage>;
  metadataDataSource = new MatTableDataSource<PackageMetadata>();

  constructor(
    private packagesClient: PackagesClient,
    private filesClient: FileClient,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.presentationPackage$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => this.packagesClient.getPackage(parseInt(params.get('id')!))),
      shareReplay()
    );
    this.presentationPackage$.subscribe(
      (pkg) => {
        this.metadataDataSource.data = pkg.metadata!;
      }
    )
  }

  getPackageDownloadUrl(id: number) {
    return this.filesClient.getPackageDownloadUrl(id);
  }

  openUploadDialog(pkg: PresentationPackage) {
    this.dialog.open(ExhibitUploadDialogComponent, {
      data: {
        package_id: pkg.id!
      }
    });
  }
}

export interface PackageDetailData {
  id: number;
  name: string;
  type: string;
  metadata: MetadataData[];
}

export interface MetadataData {
  key: string;
  value: string;
}