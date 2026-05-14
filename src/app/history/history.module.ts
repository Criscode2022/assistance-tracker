import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { HistoryPage } from './history.page';

const routes: Routes = [{ path: '', component: HistoryPage }];

@NgModule({
  declarations: [HistoryPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class HistoryPageModule {}
