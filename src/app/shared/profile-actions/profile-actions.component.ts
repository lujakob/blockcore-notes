import { Component, Input, ViewChild } from '@angular/core';
import { NotesService } from 'src/app/services/notes.service';
import { ProfileService } from 'src/app/services/profile.service';
import { Utilities } from 'src/app/services/utilities.service';
import { NostrEventDocument, NostrNoteDocument, NostrProfile, NostrProfileDocument } from '../../services/interfaces';

@Component({
  selector: 'app-profile-actions',
  templateUrl: './profile-actions.component.html',
})
export class ProfileActionsComponent {
  @Input() pubkey: string = '';
  @Input() profile?: NostrProfileDocument;
  @Input() event?: NostrNoteDocument | NostrEventDocument | any;

  constructor(private profileService: ProfileService, private notesService: NotesService, private utilities: Utilities) {}

  async saveNote() {
    if (!this.event) {
      return;
    }

    const note = this.event as NostrNoteDocument;
    note.saved = Math.floor(Date.now() / 1000);

    await this.notesService.putNote(note);
  }

  async removeNote() {
    if (!this.event) {
      return;
    }

    console.log('DELETE EVENT:', this.event);

    await this.notesService.deleteNote(this.event.id);
  }

  async follow(circle?: string) {
    if (!this.profile) {
      return;
    }

    await this.profileService.follow(this.profile.pubkey, circle);
  }

  async unfollow() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unfollow(this.profile.pubkey);
  }

  async block() {
    if (!this.profile) {
      return;
    }

    await this.profileService.block(this.profile.pubkey);
  }

  async unblock() {
    if (!this.profile) {
      return;
    }

    await this.profileService.unblock(this.profile.pubkey);
  }

  async ngOnInit() {
    if (!this.profile && !this.pubkey) {
      return;
    }

    if (!this.pubkey) {
      this.pubkey = this.profile!.pubkey;
    }

    if (!this.profile) {
      this.profile = await this.profileService.getProfile(this.pubkey);
    }

    // this.imagePath = this.profile.picture;
    // this.tooltip = this.profile.about;
    // this.profileName = this.utilities.getNostrIdentifier(this.pubkey);

    // // TODO: Just a basic protection of long urls, temporary.
    // if (this.profile.name.length > 255) {
    //   return;
    // }

    // this.tooltipName = this.profileName; // Only set tooltip if we replace the publicKey with it.
    // this.profileName = this.profile.name;

    // const profile = this.profiles.profiles[this.publicKey] as NostrProfile;

    // if (!profile || !profile.picture) {
    //   return;
    // }

    // // TODO: Just a basic protection of long urls, temporary.
    // if (profile.picture.length > 255) {
    //   return;
    // }
  }
}
