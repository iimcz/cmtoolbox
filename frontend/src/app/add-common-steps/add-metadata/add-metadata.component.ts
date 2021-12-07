import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, Subject } from 'rxjs';
import { MetadataRecord, PackageProperties, PackagesClient, UnfinishedPackage } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-metadata',
  templateUrl: './add-metadata.component.html',
  styleUrls: ['./add-metadata.component.css']
})
export class AddMetadataComponent implements AfterViewInit {
  @Input() package!: UnfinishedPackage;

  displayedColumns: string[] = ['action', 'key', 'value'];
  tableDataSource = new MatTableDataSource<MetadataRecord>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  metaChangeSubject: Subject<void> = new Subject();
  propChangeSubject: Subject<void> = new Subject();

  // Set metadata keys
  metaAuthor: string = "";
  metaExpo: string = "";

  constructor(
    private packagesClient: PackagesClient
  ) { }

  ngOnInit(): void {
    this.metaChangeSubject.pipe(
      debounceTime(10000)
    ).subscribe(() => {
      this.saveMetadata();
    });

    this.propChangeSubject.pipe(
      debounceTime(10000)
    ).subscribe(() => {
      this.saveProperties();
    });

    if (this.package.metadata)
    {
      this.metaAuthor = this.package.metadata.find((val) => val.key === 'author')?.value!;
      this.metaExpo = this.package.metadata.find((val) => val.key === 'expo')?.value!;

      const records = this.package.metadata.filter(
        (val) => val.key != 'author' && val.key != 'expo'
      ).map(
        (val) => new MetadataRecord({ key: val.key, value: val.value })
      );
      this.tableDataSource.data = records;
    }
  }

  ngAfterViewInit(): void {
    this.tableDataSource.paginator = this.paginator;
    this.tableDataSource.sort = this.sort;
  }

  addMetadata(key: string, value: string) {
    this.tableDataSource.data.push(new MetadataRecord({ key: key, value: value }));
    this.tableDataSource.data = this.tableDataSource.data; // refresh data
    this.metadataChanged();
  }

  deleteMetadata(i: number) {
    this.tableDataSource.data.splice(i, 1);
    this.tableDataSource.data = this.tableDataSource.data; // refresh data
    this.metadataChanged();
  }

  metadataChanged(): void {
    this.metaChangeSubject.next();
  }

  propertiesChanged(): void {
    this.propChangeSubject.next();
  }

  saveAllData(): void {
    this.saveMetadata();
    this.saveProperties();
  }

  saveMetadata(): void {
    const records: MetadataRecord[] = [];

    records.push(new MetadataRecord({ key: 'author', value: this.metaAuthor }));
    records.push(new MetadataRecord({ key: 'expo', value: this.metaExpo }));
    for (const metadata of this.tableDataSource.data) {
      records.push(metadata);
    }

    this.packagesClient.saveMetadataForPackage(this.package.id!, records).subscribe(
      // Do nothing.
    );
  }

  saveProperties(): void {
    this.packagesClient.setPackageProperties(this.package.id!, new PackageProperties({
      name: this.package.name,
      description: this.package.description
    })).subscribe(
      // Do nothind.
    );
  }
}
