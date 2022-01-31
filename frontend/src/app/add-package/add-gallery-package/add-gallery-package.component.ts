import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { map, merge, mergeWith, Observable, share, shareReplay, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { Action, GalleryImage, LayoutType, Parameters, Settings } from 'src/app/interfaces/package-descriptor.generated';
import { FileClient } from 'src/app/services/api';
import { ILayout, IParameters, ISettings, IVector2, PackagesClient, PresentationPackage, Vector2 } from 'src/app/services/api.generated.service';
import { Settings as ApiSettings, Parameters as ApiParameters, Layout as ApiLayout, LayoutType as ApiLayoutType} from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-gallery-package',
  templateUrl: './add-gallery-package.component.html',
  styleUrls: ['./add-gallery-package.component.css']
})
export class AddGalleryPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  unfinishedPackage$!: Observable<PresentationPackage>;

  notifyPackageUpdate$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;
    
  galleryItemsDataSource = new MatTableDataSource<GalleryItem>();
  galleryCustomControls = new MatTableDataSource<CustomControl>();

  gallerySettings: Settings = {
    layoutType: LayoutType.Grid,
    layout: {
      width: 3,
      height: 3,
      verticalSpacing: 0,
      horizontalSpacing: 0,

      visibleImages: 3,
      spacing: 0
    },

    padding: {
      X: 0,
      Y: 0
    },
    scrollDelay: 5,
    slideAnimationLength: 1,
    backgroundColor: "#000000"
  };

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

  saveParametersAndInputs(id: number) {
    let inputs: Action[] = []; // TODO: fill

    let settings = new ApiSettings(this.gallerySettings as ISettings);
    let layout = new ApiLayout(this.gallerySettings.layout as ILayout);
    let padding = new Vector2(this.gallerySettings.padding as IVector2);
    let params = new ApiParameters({ displayType: 'gallery', settings: settings });
    settings.layout = layout;
    settings.padding = padding;
    settings.layoutType = this.mapLayoutType(this.gallerySettings.layoutType!);

    this.packagesClient.setPackageParameters(id, params)
      .subscribe(
        // TODO: handle
      );
  }

  refreshGalleryItems(pkg: PresentationPackage) {
    const newData: GalleryItem[] = [];
    for (let file of pkg.dataFiles!) {
      newData.push({
        previewUrl: this.fileClient.getThumbnailUrl(file.id!),
        fileName: file.path!.substring(file.path?.lastIndexOf('/')! + 1), // TODO: implement on backend instead
      });
    }
    this.galleryItemsDataSource.data = newData;
  }

  refreshPackage(id: number) {
    this.notifyPackageUpdate$.next(id);
  }

  mapLayoutType(lt: LayoutType): ApiLayoutType {
    switch (lt) {
      case LayoutType.Grid:
        return ApiLayoutType.Grid;
      case LayoutType.List:
        return ApiLayoutType.List;
    }
  }
}

export interface GalleryItem extends GalleryImage {
  previewUrl: string;
}

export interface CustomControl {
  action: string;
  eventType: string;
  eventParams: string;
}