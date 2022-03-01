import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { map, merge, mergeWith, Observable, shareReplay, Subject, switchMap } from 'rxjs';
import { ExhibitUploadDialogComponent } from '../dialogs/exhibit-upload-dialog/exhibit-upload-dialog.component';
import { FileClient } from '../services/api';
import { PackageState, PackageMetadata, PackagesClient, PresentationPackage } from '../services/api.generated.service';
import { EventSocketService, EventType } from '../services/event-socket.service';

@Component({
  selector: 'app-package-detail',
  templateUrl: './package-detail.component.html',
  styleUrls: ['./package-detail.component.css']
})
export class PackageDetailComponent implements OnInit {
  public PackageState = PackageState;
  
  presentationPackage$!: Observable<PresentationPackage>;
  notifyProcessedEvent$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;

  metadataDataSource = new MatTableDataSource<PackageMetadata>();
  packageId: number = 0; // TODO: more reactive implementation

  constructor(
    private packagesClient: PackagesClient,
    private filesClient: FileClient,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private eventSocket: EventSocketService
  ) { }

  ngOnInit(): void {
    this.notifyRouteUpdate$ = this.route.paramMap.pipe(
      map((params: ParamMap) => parseInt(params.get('id')!))
    );
    this.presentationPackage$ = this.notifyRouteUpdate$.pipe(
      mergeWith(this.notifyProcessedEvent$),
      switchMap((id: number) => this.packagesClient.getPackage(id)),
      shareReplay()
    );
    this.presentationPackage$.subscribe(
      (pkg) => {
        this.metadataDataSource.data = pkg.metadata!;
        this.packageId = pkg.id!;
      }
    )
    this.eventSocket.subscribeEvent(EventType.PackageProcessed).subscribe(() => {
      this.notifyProcessedEvent$.next(this.packageId);
    });
  }

  getPackageDownloadUrl(id: number) {
    return this.filesClient.getPackageDownloadUrl(id);
  }

  getPackageThumbnailUrl(id: number) {
    return this.filesClient.getPackageThumbnailUrl(id);
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