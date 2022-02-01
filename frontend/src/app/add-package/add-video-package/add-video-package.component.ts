import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { AspectRatio, Settings } from 'src/app/interfaces/package-descriptor.generated';
import { FileClient } from 'src/app/services/api';
import { ISettings, PackagesClient, PresentationPackage } from 'src/app/services/api.generated.service';
import { Parameters as ApiParameters, Settings as ApiSettings, AspectRatio as ApiAspectRatio } from 'src/app/services/api.generated.service';

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
    private fileClient: FileClient
  ) { }

  ngOnInit(): void {
    this.unfinishedPackage$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.packagesClient.getUnfinishedPackage(parseInt(params.get('id')!)))
    );
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

  applySimpleConversionParams() {

  }

  applyAdvancedConversionParams() {

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
    this.packagesClient.setPackageInputs(id, []) // TODO: fill with actual data
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