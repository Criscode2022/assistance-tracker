import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { LogPage } from './log.page';

const routes: Routes = [{ path: '', component: LogPage }];

@NgModule({
  declarations: [LogPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class LogPageModule {}
