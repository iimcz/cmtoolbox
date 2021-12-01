import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-add-metadata',
  templateUrl: './add-metadata.component.html',
  styleUrls: ['./add-metadata.component.css']
})
export class AddMetadataComponent implements AfterViewInit {
  displayedColumns: string[] = ['action', 'key', 'value'];
  testDataSource = new MatTableDataSource<MetadataEntry>(TEST_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() { }

  ngAfterViewInit(): void {
    this.testDataSource.paginator = this.paginator;
    this.testDataSource.sort = this.sort;
  }

}

const TEST_DATA: MetadataEntry[] = [
  { key: 'abc', value: 'Test value' }
]

export interface MetadataEntry {
  key: string;
  value: string;
}