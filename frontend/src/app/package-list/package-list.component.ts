import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.css']
})
export class PackageListComponent implements OnInit, AfterViewInit {
  searchTerm: string = "";

  displayedColumns: string[] = ['id', 'label', 'desc'];
  testDataSource = new MatTableDataSource<Package>(TEST_DATA);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) { }

  ngAfterViewInit(): void {
    this.testDataSource.paginator = this.paginator;
    this.testDataSource.sort = this.sort;
  }

  ngOnInit(): void {
  }

  navigatePackage(item: Package) {
    this.router.navigate(['/package', {id: item.id}]);
  }

}

export interface Package {
  id: number;
  label: string;
  desc: string;
  thumbUrl: string;
}

const TEST_DATA: Package[] = [
  { id: 1, label: 'Balik 1', desc: 'Testovaci popis...', thumbUrl: 'https://picsum.photos/1000/1000' },
  { id: 2, label: 'Balik 2', desc: 'Testovaci popis 2...', thumbUrl: 'https://picsum.photos/1000/1000' },
  { id: 3, label: 'Balik 3', desc: 'Testovaci popis 3...', thumbUrl: 'https://picsum.photos/1000/1000' },
  { id: 4, label: 'Balik 4', desc: 'Testovaci popis 4...', thumbUrl: 'https://picsum.photos/1000/1000' },
  { id: 5, label: 'Balik 5', desc: 'Testovaci popis 5...', thumbUrl: 'https://picsum.photos/1000/1000' },
  { id: 6, label: 'Balik 6', desc: 'Testovaci popis 6...', thumbUrl: 'https://picsum.photos/1000/1000' },
];
