// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {WorkPackageResource} from 'core-app/modules/hal/resources/work-package-resource';
import {ErrorResource} from 'core-app/modules/hal/resources/error-resource';
import {StateService} from '@uirouter/core';
import {HalResourceService} from 'core-app/modules/hal/services/hal-resource.service';
import {Injectable} from '@angular/core';
import {LoadingIndicatorService} from 'core-app/modules/common/loading-indicator/loading-indicator.service';
import {NotificationsService} from 'core-app/modules/common/notifications/notifications.service';
import {I18nService} from "core-app/modules/common/i18n/i18n.service";

@Injectable()
export class WorkPackageNotificationService {
  constructor(readonly I18n:I18nService,
              protected $state:StateService,
              protected halResourceService:HalResourceService,
              protected NotificationsService:NotificationsService,
              protected loadingIndicator:LoadingIndicatorService) {
  }

  public showSave(workPackage:WorkPackageResource, isCreate:boolean = false) {
    var message:any = {
      message: this.I18n.t('js.notice_successful_' + (isCreate ? 'create' : 'update')),
    };

    // Don't show the 'Show in full screen' link  if we're there already
    if (!this.$state.includes('work-packages.show')) {
      message.link = this.showInFullScreenLink(workPackage);
    }

    this.NotificationsService.addSuccess(message);
  }

  public handleRawError(response:any, workPackage?:WorkPackageResource) {
    if (response && response.data && response.data._type === 'Error') {
      const resource = this.halResourceService.createHalResource(response.data);
      return this.handleErrorResponse(resource, workPackage);
    }

    this.showGeneralError(response);
  }

  public handleErrorResponse(errorResource:any, workPackage?:WorkPackageResource) {
    if (!(errorResource instanceof ErrorResource)) {
      return this.showGeneralError(errorResource);
    }

    if (workPackage) {
      return this.showError(errorResource, workPackage);
    }

    this.showApiErrorMessages(errorResource);
  }

  public showError(errorResource:any, workPackage:WorkPackageResource) {
    this.showCustomError(errorResource, workPackage) || this.showApiErrorMessages(errorResource);
  }

  public showGeneralError(message?:string) {
    let error = this.I18n.t('js.error.internal');

    if (message) {
      error += ' ' + message;
    }

    this.NotificationsService.addError(error);
  }

  public showEditingBlockedError(attribute:string) {
    this.NotificationsService.addError(this.I18n.t(
      'js.work_packages.error.edit_prohibited',
      { attribute: attribute }
    ));
  }

  private showCustomError(errorResource:any, workPackage:WorkPackageResource) {
    if (errorResource.errorIdentifier === 'urn:openproject-org:api:v3:errors:PropertyFormatError') {

      let attributeName = workPackage.schema[errorResource.details.attribute].name;
      let attributeType = workPackage.schema[errorResource.details.attribute].type.toLowerCase();
      let i18nString = 'js.work_packages.error.format.' + attributeType;

      if (this.I18n.lookup(i18nString) === undefined) {
        return false;
      }

      this.NotificationsService.addError(this.I18n.t(i18nString,
        { attribute: attributeName }));

      return true;
    }
    return false;
  }

  private showApiErrorMessages(errorResource:any) {
    var messages = errorResource.errorMessages;

    if (messages.length > 1) {
      this.NotificationsService.addError('', messages);
    }
    else {
      this.NotificationsService.addError(messages[0]);
    }

    return true;
  }

  private showInFullScreenLink(workPackage:WorkPackageResource) {
    return {
      target: () => {
        this.loadingIndicator.table.promise =
          this.$state.go('work-packages.show.activity', { workPackageId: workPackage.id });
      },
      text: this.I18n.t('js.work_packages.message_successful_show_in_fullscreen')
    };
  }
}
