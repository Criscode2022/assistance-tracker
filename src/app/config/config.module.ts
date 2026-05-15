import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ConfigPage } from './config.page';

const routes: Routes = [{ path: '', component: ConfigPage }];

@NgModule({
  declarations: [ConfigPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class ConfigPageModule {}
