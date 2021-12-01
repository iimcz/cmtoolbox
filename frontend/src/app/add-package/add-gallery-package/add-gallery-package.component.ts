import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { PackagesClient, UnfinishedPackage } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-gallery-package',
  templateUrl: './add-gallery-package.component.html',
  styleUrls: ['./add-gallery-package.component.css']
})
export class AddGalleryPackageComponent implements OnInit {
  unfinishedPackage$!: Observable<UnfinishedPackage>;
  galleryItemsDataSource = new MatTableDataSource(TEST_ITEMS);
  galleryCustomControls = new MatTableDataSource(TEST_CONTROLS);

  gallerySettings: GallerySettings = {
    columns: 3,
    gapUnit: 'px',
    gap: 3,
    defaultContentFit: 'fill',
    backgroundColor: '#7CFF00',

    basicControls: 'grab-drag',
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private packagesClient: PackagesClient
  ) { }

  ngOnInit(): void {
    this.unfinishedPackage$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => this.packagesClient.getUnfinishedPackage(parseInt(params.get('id')!)))
    );
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
}

const TEST_ITEMS: GalleryItem[] = [
  { previewUrl: "https://picsum.photos/100/100", filename: "test1.png", canZoom: true, hasLink: false, link: '' },
  { previewUrl: "https://picsum.photos/100/100", filename: "test2.png", canZoom: true, hasLink: false, link: '' },
  { previewUrl: "https://picsum.photos/100/100", filename: "test3.png", canZoom: true, hasLink: false, link: '' },
  { previewUrl: "https://picsum.photos/100/100", filename: "test4.png", canZoom: true, hasLink: false, link: '' },
  { previewUrl: "https://picsum.photos/100/100", filename: "test5.png", canZoom: true, hasLink: false, link: '' },
  { previewUrl: "https://picsum.photos/100/100", filename: "test6.png", canZoom: true, hasLink: false, link: '' },
  { previewUrl: "https://picsum.photos/100/100", filename: "test7.png", canZoom: true, hasLink: false, link: '' }
];

const TEST_CONTROLS: CustomControl[] = [
  { action: 'move-up', eventType: 'gesture', eventParams: 'swipe-up' },
];

export interface GalleryItem {
  previewUrl: string;
  filename: string;

  canZoom: boolean;
  hasLink: boolean;
  link: string;
}

export interface GallerySettings {
  columns: number;
  gapUnit: string;
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