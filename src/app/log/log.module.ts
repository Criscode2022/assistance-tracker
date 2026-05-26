import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { LogPage } from './log.page';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: LogPage }];

@NgModule({
  declarations: [LogPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes), SharedModule],
})
export class LogPageModule {}
