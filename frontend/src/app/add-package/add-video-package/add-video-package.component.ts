import { BaseCdkCell } from '@angular/cdk/table';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { FileClient } from 'src/app/services/api';
import { PackagesClient, UnfinishedPackage } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-video-package',
  templateUrl: './add-video-package.component.html',
  styleUrls: ['./add-video-package.component.css']
})
export class AddVideoPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  previewUrl: string = '';
  advancedConversionSettings: boolean = false;
  unfinishedPackage$!: Observable<UnfinishedPackage>;

  videoSettings: VideoSettings = {
    defaultContentFit: 'fill',
    backgroundColor: '#000000',
    launchOption: 'immediately'
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

  initiatePreview(pkg: UnfinishedPackage) {
    this.previewUrl = this.fileClient.getPreviewUrl(pkg.dataFiles![0].id!);
  }

  addCustomControl() {
    this.videoCustomControls.data.push({action: '', eventParams: '', eventType: ''});
    this.videoCustomControls.data = this.videoCustomControls.data.slice();
  }

  removeCustomControl(control: CustomControl) {
    this.videoCustomControls.data = this.videoCustomControls.data.filter((el) => el !== control);
  }
}

export interface VideoSettings {
  defaultContentFit: string,
  backgroundColor: string,
  launchOption: string
}

export interface CustomControl {
  action: string;
  eventType: string;
  eventParams: string;
}