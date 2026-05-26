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

@NgModule({
  declarations: [AuthPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class AuthPageModule {}
