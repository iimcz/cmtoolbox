import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { combineLatestWith, map, mergeWith, Observable, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { AspectRatio, Settings } from 'src/app/interfaces/package-descriptor.generated';
import { FileClient } from 'src/app/services/api';
import { Action, ConversionClient, ISettings, Mapping, PackagesClient, Parameters, PresentationPackage, Preset, TypeEnum, VideoConversionParams } from 'src/app/services/api.generated.service';
import { Parameters as ApiParameters, Settings as ApiSettings, AspectRatio as ApiAspectRatio } from 'src/app/services/api.generated.service';
import { EventSocketService, EventType } from 'src/app/services/event-socket.service';

@Component({
  selector: 'app-add-video-package',
  templateUrl: './add-video-package.component.html',
  styleUrls: ['./add-video-package.component.css']
})
export class AddVideoPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  previewUrl: string = '';
  advancedConversionSettings: boolean = false;
  unfinishedPackage$!: Observable<PresentationPackage>;

  notifyPackageUpdate$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;

  videoSettings: Settings = {
    loop: true,
    autoStart: true,
    aspectRatio: AspectRatio.FitOutside,
    backgroundColor: '#000000',
    videoEvents: []
  };

  videoCustomControls = new MatTableDataSource<CustomControl>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private packagesClient: PackagesClient,
    private fileClient: FileClient,
    private conversionClient: ConversionClient,
    private eventSocket: EventSocketService
  ) { }

  ngOnInit(): void {
    this.notifyRouteUpdate$ = this.route.paramMap.pipe(
      map((params: ParamMap) => parseInt(params.get('id')!))
    );
    this.unfinishedPackage$ = this.notifyRouteUpdate$.pipe(
      mergeWith(this.notifyPackageUpdate$),
      switchMap((id: number) => this.packagesClient.getUnfinishedPackage(id))
    );
    this.unfinishedPackage$.pipe(
      combineLatestWith(this.eventSocket.subscribeEvent(EventType.PackagePreviewUpdated))
    ).subscribe((arr) => {
      this.initiatePreview(arr[0]);
    })
  }

  goBack(): void {
    history.back();
  }

  finishAddingPackage(id: number) {
    this.packagesClient.finishPackage(id).subscribe(
      (pkg) => {
        this.router.navigate(['/package', pkg.id]);
      }
    );
  }

  applySimpleConversionParams(pkg: PresentationPackage) {
    this.previewUrl = '';
    let param = new VideoConversionParams();
    param.usePreset = true;
    param.qualityPreset = Preset.High;

    this.conversionClient.applyVideoConversionParams(pkg.dataFiles![0].id!, param)
      .subscribe();
  }

  applyAdvancedConversionParams(pkg: PresentationPackage) {
    this.previewUrl = '';
    let param = new VideoConversionParams();
    param.usePreset = false;

    this.conversionClient.applyVideoConversionParams(pkg.dataFiles![0].id!, param)
      .subscribe();
  }

  refreshPackage(id: number) {
    this.notifyPackageUpdate$.next(id);
  }

  triggerSaveMetadata() {
    this.addMetadataComponent.saveAllData();
  }

  initiatePreview(pkg: PresentationPackage) {
    this.previewUrl = this.fileClient.getPreviewUrl(pkg.dataFiles![0].id!);
  }

  addCustomControl() {
    this.videoCustomControls.data.push({ action: '', eventParams: '', eventType: '' });
    this.videoCustomControls.data = this.videoCustomControls.data.slice();
  }

  removeCustomControl(control: CustomControl) {
    this.videoCustomControls.data = this.videoCustomControls.data.filter((el) => el !== control);
  }

  saveParametersAndInputs(id: number, filename: string) {
    let settings = new ApiSettings(this.videoSettings as ISettings);
    let params = new ApiParameters({ displayType: 'video', settings: settings });
    settings.aspectRatio = this.mapAspectRatio(this.videoSettings.aspectRatio!);
    settings.fileName = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.')) + ".webm";

    this.packagesClient.setPackageParameters(id, params)
      .subscribe(
        // TODO: handle
      );
    this.packagesClient.setPackageInputs(id, [
      new Action({
        effect: 'stop',
        mapping: new Mapping({
          source: 'depthcam1',
          eventName: 'swipeUp'
        }),
        type: TypeEnum.Event
      }),
      new Action({
        effect: 'start',
        mapping: new Mapping({
          source: 'depthcam1',
          eventName: 'swipeDown'
        }),
        type: TypeEnum.Event
      }),
      new Action({
        effect: 'setVolume',
        mapping: new Mapping({
          source: 'lightsensor1',
          inMin: 0,
          inMax: 1,
          outMin: 0,
          outMax: 1
        }),
        type: TypeEnum.Value
      })
    ]) // TODO: fill with actual data
      .subscribe(
        // TODO: handle
      );
  }

  mapAspectRatio(arIn: AspectRatio): ApiAspectRatio {
    switch (arIn) {
      case AspectRatio.FitInside:
        return ApiAspectRatio.FitInside;
      case AspectRatio.FitOutside:
        return ApiAspectRatio.FitOutside;
      case AspectRatio.Stretch:
        return ApiAspectRatio.Stretch;
    }
  }
}

export interface CustomControl {
  action: string;
  eventType: string;
  eventParams: string;
}