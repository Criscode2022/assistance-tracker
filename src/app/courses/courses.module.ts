import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CoursesPage } from './courses.page';

const routes: Routes = [{ path: '', component: CoursesPage }];

@NgModule({
  declarations: [CoursesPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class CoursesPageModule {}
