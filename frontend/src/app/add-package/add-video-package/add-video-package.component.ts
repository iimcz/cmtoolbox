import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { combineLatestWith, map, mergeWith, Observable, Subject, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { AspectRatio, Settings } from 'src/app/interfaces/package-descriptor.generated';
import { FileClient } from 'src/app/services/api';
import { Action, ConversionClient, ISettings, Mapping, PackagesClient, Parameters, PresentationPackage, Preset, ThresholdType, TypeEnum, VideoConversionParams } from 'src/app/services/api.generated.service';
import { Parameters as ApiParameters, Settings as ApiSettings, AspectRatio as ApiAspectRatio } from 'src/app/services/api.generated.service';
import { EventSocketService, EventType } from 'src/app/services/event-socket.service';

@Component({
  selector: 'app-add-video-package',
  templateUrl: './add-video-package.component.html',
  styleUrls: ['./add-video-package.component.css']
})
export class AddVideoPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  @ViewChild('settingPreviewPlayer') settingsPreviewPlayer!: ElementRef;
  @ViewChild('conversionPreviewPlayer') conversionPreviewPlayer!: ElementRef;

  previewUrl: string = '';
  advancedConversionSettings: boolean = false;
  unfinishedPackage$!: Observable<PresentationPackage>;

  notifyPackageUpdate$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;

  simpleConversionFG = this.fb.group({
    videoQuality: [0],
    fps: [30]
  });
  advancedConversionFG = this.fb.group({
    videoBitrate: [5000],
    audioBitrate: [320],
    fps: [30],
    contrast: [1.0],
    brightness: [0.0],
    saturation: [1.0],
    gamma: [1.0],
    customParams: ['']
  });
  settingsFG = this.fb.group({
    loop: [true],
    autoStart: [true],
    aspectRatio: ['fitOutside'],
    backgroundColor: ['#000000']
  });

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
    private eventSocket: EventSocketService,
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
    param.qualityPreset = parseInt(this.simpleConversionFG.get('videoQuality')?.value);
    param.fps = this.simpleConversionFG.get('fps')?.value;

    this.conversionClient.applyVideoConversionParams(pkg.dataFiles![0].id!, param)
      .subscribe();
  }

  applyAdvancedConversionParams(pkg: PresentationPackage) {
    this.previewUrl = '';
    let param = new VideoConversionParams();
    param.usePreset = false;
    param.videoBitrate = this.advancedConversionFG.get('videoBitrate')?.value;
    param.audioBitrate = this.advancedConversionFG.get('audioBitrate')?.value;
    param.fps = this.advancedConversionFG.get('fps')?.value;
    param.contrast = this.advancedConversionFG.get('contrast')?.value;
    param.brightness = this.advancedConversionFG.get('brightness')?.value;
    param.saturation = this.advancedConversionFG.get('saturation')?.value;
    param.gamma = this.advancedConversionFG.get('gamma')?.value;
    param.customParams = this.advancedConversionFG.get('customParams')?.value;

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
    let settings = new ApiSettings();
    settings.loop = this.settingsFG.get('loop')?.value;
    settings.autoStart = this.settingsFG.get('autoStart')?.value;
    settings.backgroundColor = this.settingsFG.get('backgroundColor')?.value;
    settings.aspectRatio = this.mapAspectRatio(this.settingsFG.get('aspectRatio')?.value);
    settings.fileName = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.')) + ".webm";

    let params = new ApiParameters({ displayType: 'video', settings: settings });

    this.packagesClient.setPackageParameters(id, params)
      .subscribe(
        // TODO: handle
      );
    this.packagesClient.setPackageInputs(id, [
      new Action({
        effect: 'play',
        mapping: new Mapping({
          source: 'atom_1_pir_1',
          thresholdType: ThresholdType.Integer,
          threshold: '0'
        }),
        type: TypeEnum.ValueTrigger
      }),
      new Action({
        effect: 'play',
        mapping: new Mapping({
          source: 'atom_2_pir_1',
          thresholdType: ThresholdType.Integer,
          threshold: '0'
        }),
        type: TypeEnum.ValueTrigger
      }),
      new Action({
        effect: 'setVolume',
        mapping: new Mapping({
          source: 'lightsensor1',
          inMin: 0,
          inMax: 150,
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

  stepperSelectionChange(event: StepperSelectionEvent) {
    if (event.selectedIndex !== 2) {
      const cplayer: HTMLVideoElement = this.conversionPreviewPlayer.nativeElement;
      cplayer.pause();
    }
    if (event.selectedIndex !== 3) {
      const splayer: HTMLVideoElement = this.settingsPreviewPlayer.nativeElement;
      splayer.pause();
    }
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