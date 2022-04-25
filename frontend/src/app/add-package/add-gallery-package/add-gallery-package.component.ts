import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { map, merge, mergeWith, Observable, share, shareReplay, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { GalleryImage, LayoutType, Parameters, Settings } from 'src/app/interfaces/package-descriptor.generated';
import { FileClient } from 'src/app/services/api';
import { Action, ILayout, IParameters, ISettings, IVector2, Mapping, PackagesClient, PresentationPackage, TypeEnum, Vector2 } from 'src/app/services/api.generated.service';
import { Settings as ApiSettings, Parameters as ApiParameters, Layout as ApiLayout, LayoutType as ApiLayoutType, GalleryImage as ApiGalleryImage } from 'src/app/services/api.generated.service';

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

  settingsFG = this.fb.group({
    layoutType: ['grid', { initialValueIsDefault: true }],
    
    width: [2, { initialValueIsDefault: true }],
    height: [2, { initialValueIsDefault: true }],
    verticalSpacing: [10, { initialValueIsDefault: true }],
    horizontalSpacing: [10, { initialValueIsDefault: true }],
    
    visibleImages: [2, { initialValueIsDefault: true }],
    spacing: [10, { initialValueIsDefault: true }],

    padding: [0, { initialValueIsDefault: true }],
    scrollDelay: [5.0, { initialValueIsDefault: true }],
    slideAnimationLength: [2.0, { initialValueIsDefault: true }],
    backgroundColor: ['#000000', { initialValueIsDefault: true }]
  });

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
    private fileClient: FileClient,
    private fb: FormBuilder
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
    this.galleryCustomControls.data.push({ action: '', eventParams: '', eventType: '' });
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

    let settings = new ApiSettings();
    settings.layoutType = this.mapLayoutType(this.settingsFG.get('layoutType')?.value);
    settings.layout = new ApiLayout();

    if (this.settingsFG.get('layoutType')?.value === 'grid') {
      settings.layout.width = this.settingsFG.get('width')?.value;
      settings.layout.height = this.settingsFG.get('height')?.value;
      settings.layout.verticalSpacing = this.settingsFG.get('verticalSpacing')?.value / 100.0;
      settings.layout.horizontalSpacing = this.settingsFG.get('horizontalSpacing')?.value / 100.0;
    } else {
      settings.layout.visibleImages = this.settingsFG.get('visibleImages')?.value;
      settings.layout.spacing = this.settingsFG.get('spacing')?.value / 100.0;
    }
    settings.layout.images = this.galleryItemsDataSource.data.map((img): ApiGalleryImage => {
      return new ApiGalleryImage({
        activatedEvent: img.selectedEvent,
        fileName: img.fileName,
        selectedEvent: img.activatedEvent
      })
    });

    settings.padding = new Vector2({ x: this.settingsFG.get('padding')?.value / 100.0, y: this.settingsFG.get('padding')?.value / 100.0 });
    settings.scrollDelay = this.settingsFG.get('scrollDelay')?.value;
    settings.slideAnimationLength = this.settingsFG.get('slideAnimationLength')?.value;
    settings.backgroundColor = this.settingsFG.get('backgroundColor')?.value;

    let params = new ApiParameters({ displayType: 'gallery', settings: settings });

    this.packagesClient.setPackageParameters(id, params)
      .subscribe(
        // TODO: handle
      );
    this.packagesClient.setPackageInputs(id, [
      // TESTING DATA
      // new Action({
      //   effect: 'left',
      //   type: TypeEnum.Event,
      //   mapping: new Mapping({
      //     source: 'depthCam1',
      //     eventName: 'swipeLeft'
      //   })
      // }),
      // new Action({
      //   effect: 'right',
      //   type: TypeEnum.Event,
      //   mapping: new Mapping({
      //     source: 'depthCam1',
      //     eventName: 'swipeRight'
      //   })
      // })
    ]) // TODO: fill with actual data
      .subscribe(
        // TODO: handle
      );
  }

  refreshGalleryItems(pkg: PresentationPackage) {
    const newData: GalleryItem[] = [];
    for (let file of pkg.dataFiles!) {
      newData.push({
        previewUrl: this.fileClient.getFileThumbnailUrl(file.id!),
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