import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CoursesPage } from './courses.page';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: CoursesPage }];

@NgModule({
  declarations: [CoursesPage],
  imports: [CommonModule, FormField, IonicModule, RouterModule.forChild(routes), SharedModule],
})
export class CoursesPageModule {}
