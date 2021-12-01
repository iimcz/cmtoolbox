import { ViewChild } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements AfterViewInit {
  searchTerm: string = "";

  displayedColumns: string[] = ['id', 'username', 'name'];
  testDataSource = new MatTableDataSource<User>(TEST_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router) { }

  ngAfterViewInit() {
    this.testDataSource.paginator = this.paginator;
    this.testDataSource.sort = this.sort;
  }

  navigateUser(user: User) {
    this.router.navigate(['/user', {id: user.id}]);
  }
}

export interface User {
  id: number,
  username: string,
  name: string
}

const TEST_DATA: User[] = [
  { id: 1, username: 'franta', name: 'Franta Tester' },
  { id: 2, username: 'testuser', name: 'Testovací uživatel' },
  { id: 3, username: 'nobody', name: 'Nikdo' },
  { id: 4, username: 'franta', name: 'Franta Tester' },
  { id: 5, username: 'testuser', name: 'Testovací uživatel' },
  { id: 6, username: 'nobody', name: 'Nikdo' },
  { id: 7, username: 'franta', name: 'Franta Tester' },
  { id: 8, username: 'testuser', name: 'Testovací uživatel' },
  { id: 9, username: 'nobody', name: 'Nikdo' },
  { id: 10, username: 'franta', name: 'Franta Tester' },
  { id: 11, username: 'testuser', name: 'Testovací uživatel' },
  { id: 12, username: 'nobody', name: 'Nikdo' }
]
