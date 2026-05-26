import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AuthPage } from './auth.page';
import { GuestAuthGuard } from '../guards/guest-auth.guard';

const routes: Routes = [
  { path: '', component: AuthPage, canActivate: [GuestAuthGuard] },
];

import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [AuthPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes), SharedModule],
})
export class AuthPageModule {}
