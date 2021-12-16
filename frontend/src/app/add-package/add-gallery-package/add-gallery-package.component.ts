import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { map, merge, mergeWith, Observable, share, shareReplay, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { FileClient } from 'src/app/services/api';
import { PackagesClient, UnfinishedPackage } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-gallery-package',
  templateUrl: './add-gallery-package.component.html',
  styleUrls: ['./add-gallery-package.component.css']
})
export class AddGalleryPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  unfinishedPackage$!: Observable<UnfinishedPackage>;

  notifyPackageUpdate$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;
    
  galleryItemsDataSource = new MatTableDataSource<GalleryItem>();
  galleryCustomControls = new MatTableDataSource<CustomControl>();

  gallerySettings: GallerySettings = {
    columns: 3,
    gap: 3,
    defaultContentFit: 'fill',
    backgroundColor: '#7CFF00',

    basicControls: 'grab-drag',
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private packagesClient: PackagesClient,
    private fileClient: FileClient
  ) { }

  ngOnInit(): void {
    this.notifyRouteUpdate$ = this.route.paramMap.pipe(
      map((params: ParamMap) => parseInt(params.get('id')!))
    );
    this.unfinishedPackage$ = this.notifyRouteUpdate$.pipe(
      mergeWith(this.notifyPackageUpdate$),
      switchMap((id: number) => this.packagesClient.getUnfinishedPackage(id))
    );
    this.unfinishedPackage$.subscribe((pkg) => {
      this.refreshGalleryItems(pkg);
    });
  }

  finishAddingPackage(id: number) {
    this.packagesClient.finishPackage(id).subscribe(
      (pkg) => {
        this.router.navigate(['/package', pkg.id]);
      }
    );
  }

  onGalleryOrderListDropped(event: CdkDragDrop<GalleryItem[]>) {
    // Swap the elements around
    moveItemInArray(this.galleryItemsDataSource.data, event.previousIndex, event.currentIndex);
    this.galleryItemsDataSource.data = this.galleryItemsDataSource.data.slice();
  }

  addCustomControl() {
    this.galleryCustomControls.data.push({action: '', eventParams: '', eventType: ''});
    this.galleryCustomControls.data = this.galleryCustomControls.data.slice();
  }

  removeCustomControl(control: CustomControl) {
    this.galleryCustomControls.data = this.galleryCustomControls.data.filter((el) => el !== control);
  }

  goBack() {
    history.back();
  }

  triggerSaveMetadata() {
    this.addMetadataComponent.saveAllData();
  }

  refreshGalleryItems(pkg: UnfinishedPackage) {
    const newData: GalleryItem[] = [];
    for (let file of pkg.dataFiles!) {
      newData.push({
        previewUrl: this.fileClient.getThumbnailUrl(file.id!),
        filename: file.path!.substr(file.path?.lastIndexOf('/')! + 1), // TODO: implement on backend instead
        canZoom: false,
        hasLink: false,
        link: ''
      });
    }
    this.galleryItemsDataSource.data = newData;
  }

  refreshPackage(id: number) {
    this.notifyPackageUpdate$.next(id);
  }
}

export interface GalleryItem {
  previewUrl: string;
  filename: string;

  canZoom: boolean;
  hasLink: boolean;
  link: string;
}

export interface GallerySettings {
  columns: number;
  gap: number;
  defaultContentFit: string;
  backgroundColor: string;

  basicControls: string;
}

export interface CustomControl {
  action: string;
  eventType: string;
  eventParams: string;
}