import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { combineLatestWith, map, mergeWith, Observable, Subject, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { FileClient } from 'src/app/services/api';
import { Action, Condition, ConversionClient, ISettings, Mapping, PackagesClient, Parameters, PresentationPackage, Preset, ThresholdType, TypeEnum, VideoConversionParams } from 'src/app/services/api.generated.service';
import { Parameters as ApiParameters, Settings as ApiSettings } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-panorama-package',
  templateUrl: './add-panorama-package.component.html',
  styleUrls: ['./add-panorama-package.component.css']
})
export class AddPanoramaPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  unfinishedPackage$!: Observable<PresentationPackage>;

  notifyPackageUpdate$: Subject<number> = new Subject();
  notifyRouteUpdate$!: Observable<number>;

  settingsFG = this.fb.group({
    cameraVerticalAngle: [0.0, { initialValueIsDefault: true }],
    rotationSpeed: [1.5, { initialValueIsDefault: true }]
  });

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
      this.refreshPano(pkg!);
    });
  }

  refreshPano(pkg: PresentationPackage) {
    //this.scene.remove
  }

  goBack(): void {
    history.back();
  }

  saveParametersAndInputs(id: number, filename: string) {
    let inputs: Action[] = [];
    let settings = new ApiSettings();
    settings.fileName = filename.substring(filename.lastIndexOf('/') + 1);
    settings.cameraVerticalAngle = this.settingsFG.get('cameraVerticalAngle')?.value;
    settings.rotationSpeed = this.settingsFG.get('rotationSpeed')?.value;

    let params = new ApiParameters({ displayType: 'panorama', settings: settings });

    this.packagesClient.setPackageParameters(id, params)
      .subscribe(
        // TODO: handle
      );
    this.packagesClient.setPackageInputs(id, inputs) // TODO: fill with actual data
      .subscribe(
        // TODO: handle
      );
  }

  finishAddingPackage(id: number) {
    this.packagesClient.finishPackage(id).subscribe(
      (pkg) => {
        this.router.navigate(['/package', pkg.id]);
      }
    );
  }

  refreshPackage(id: number) {
    this.notifyPackageUpdate$.next(id);
  }

  triggerSaveMetadata() {
    this.addMetadataComponent.saveAllData();
  }

}
