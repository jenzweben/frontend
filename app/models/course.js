/* global moment */
import DS from 'ember-data';
import Ember from 'ember';

var Course = DS.Model.extend({
  title: DS.attr('string'),
  startDate: DS.attr('date'),
  endDate: DS.attr('date'),
  level: DS.attr('number'),
  year: DS.attr('number'),
  externalId: DS.attr('string'),
  deleted: DS.attr('boolean'),
  locked: DS.attr('boolean'),
  archived: DS.attr('boolean'),
  publishedAsTbd: DS.attr('boolean'),
  sessions: DS.hasMany('session', {async: true}),
  owningSchool: DS.belongsTo('school', {async: true}),
  clerkshipType: DS.belongsTo('course-clerkship-type', {async: true}),
  isPublished: Ember.computed.notEmpty('publishEvent.content'),
  isNotPublished: Ember.computed.not('isPublished'),
  isScheduled: Ember.computed.oneWay('publishedAsTbd'),
  status: function(){
    if(this.get('publishedAsTbd')){
      return Ember.I18n.t('general.scheduled');
    }
    if(this.get('isPublished')){
      return Ember.I18n.t('general.published');
    }
    return Ember.I18n.t('general.notPublished');
  }.property('isPublished', 'publishedAsTbd'),
  publishEvent: DS.belongsTo('publish-event', {async: true}),
  directors: DS.hasMany('user', {async: true}),
  cohorts: DS.hasMany('cohort', {async: true}),
  disciplines: DS.hasMany('discipline', {async: true}),
  objectives: DS.hasMany('objective', {async: true}),
  meshDescriptors: DS.hasMany('mesh-descriptor', {async: true}),
  learningMaterials: DS.hasMany('course-learning-material', {async: true}),
  academicYear: function(){
    return this.get('year') + ' - ' + (parseInt(this.get('year')) + 1);
  }.property('year'),
  competencies: function(){
    var defer = Ember.RSVP.defer();
    this.get('objectives').then(function(objectives){
      var promises = objectives.getEach('treeCompetencies');
      Ember.RSVP.all(promises).then(function(trees){
        var competencies = trees.reduce(function(array, set){
            return array.pushObjects(set.toArray());
        }, []);
        competencies = competencies.uniq().filter(function(item){
          return item != null;
        });
        defer.resolve(competencies);
      });
    });
    return DS.PromiseArray.create({
      promise: defer.promise
    });
  }.property('objectives.@each.treeCompetencies'),
  domains: function(){
    var defer = Ember.RSVP.defer();
    var domainContainer = {};
    var domainIds = [];
    var promises = [];
    this.get('competencies').forEach(function(competency){
      promises.pushObject(competency.get('domain').then(
        domain => {
          if(!domainContainer.hasOwnProperty(domain.get('id'))){
            domainIds.pushObject(domain.get('id'));
            domainContainer[domain.get('id')] = Ember.ObjectProxy.create({
              content: domain,
              subCompetencies: []
            });
          }
          if(competency.get('id') !== domain.get('id')){
            var subCompetencies = domainContainer[domain.get('id')].get('subCompetencies');
            if(!subCompetencies.contains(competency)){
              subCompetencies.pushObject(competency);
              subCompetencies.sortBy('title');
            }
          }
        }
      ));
    });
    Ember.RSVP.all(promises).then(function(){
      var domains = domainIds.map(function(id){
        return domainContainer[id];
      }).sortBy('title');
      defer.resolve(domains);
    });

    return DS.PromiseArray.create({
      promise: defer.promise
    });
  }.property('competencies.@each.domain'),
  publishedSessions: Ember.computed.filterBy('sessions', 'isPublished'),
  publishedSessionOfferingCounts: Ember.computed.mapBy('publishedSessions', 'offerings.length'),
  publishedOfferingCount: Ember.computed.sum('publishedSessionOfferingCounts'),
  setDatesBasedOnYear: function(){
    var today = moment();
    var firstDayOfYear = moment(this.get('year') + '-7-1', "YYYY-MM-DD");
    var startDate = today < firstDayOfYear?firstDayOfYear:today;
    var endDate = moment(startDate).add('8', 'weeks');
    this.set('startDate', startDate.toDate());
    this.set('endDate', endDate.toDate());
  },
  allPublicationIssuesCollection: Ember.computed.collect('requiredPublicationIssues.length', 'optionalPublicationIssues.length'),
  allPublicationIssuesLength: Ember.computed.sum('allPublicationIssuesCollection'),
  requiredPublicationIssues: function(){
    var self = this;
    var issues = [];
    var requiredSet = [
      'startDate',
      'endDate',
    ];
    var requiredLength = [
      'cohorts',
    ];
    requiredSet.forEach(function(val){
      if(!self.get(val)){
        issues.push(val);
      }
    });

    requiredLength.forEach(function(val){
      if(self.get(val + '.length') === 0){
        issues.push(val);
      }
    });

    return issues;
  }.property(
    'startDate',
    'endDate',
    'cohorts.length'
  ),
  optionalPublicationIssues: function(){
    var self = this;
    var issues = [];
    var requiredLength = [
      'disciplines',
      'objectives',
      'meshDescriptors',
    ];

    requiredLength.forEach(function(val){
      if(self.get(val + '.length') === 0){
        issues.push(val);
      }
    });

    return issues;
  }.property(
    'disciplines.length',
    'objectives.length',
    'meshDescriptors.length'
  ),
  associatedLearnerGroups: function(){
    var deferred = Ember.RSVP.defer();
    this.get('sessions').then(function(sessions){
      Ember.RSVP.all(sessions.mapBy('associatedLearnerGroups')).then(function(sessionLearnerGroups){
        var allGroups = [].concat.apply([],sessionLearnerGroups);
        var groups = allGroups?allGroups.uniq().sortBy('title'):[];
        deferred.resolve(groups);
      });
    });

    return DS.PromiseArray.create({
      promise: deferred.promise
    });
  }.property('sessions.[].associatedLearnerGroups.[]'),
});

export default Course;
