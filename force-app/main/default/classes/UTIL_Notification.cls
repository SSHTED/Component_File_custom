/**
 * @Class : UTIL_Notification
 *
 * @Method :
 *  - calloutSend(notiTypeDevName, targetId, targetPageRef, title, body, userIds) : 비동기 방식 호출 알림 (Trigger 용)
 *  - unCalloutSend(notiTypeDevName, targetId, targetPageRef, title, body, userIds) : 동기 방식 호출 알림 (Batch, Controller 용)
 *  - send(notiTypeDevName, targetId, targetPageRef, title, body, userIds)
 *
 * @Author : Yong-Jin, Cha
 * @Date : 2023-04-05
 * @Version : 1.0
 * @Modified :
 *  ---------------------------------------------
 *  NO | Date       | Modifier      | Description
 *  ---------------------------------------------
 *  1. | 2024-01-19 | 안종민         | 최초작성
 */
global without sharing class UTIL_Notification {
    
    @future(callout=true)
    global static void calloutSend(String notiTypeDevName
        , String targetId
        , String targetPageRef
        , String title
        , String body
        , Set<String> userIds)
    {
        send(notiTypeDevName, targetId, targetPageRef, title, body, userIds);
    }
    
    global static void unCalloutSend(String notiTypeDevName
        , String targetId
        , String targetPageRef
        , String title
        , String body
        , Set<String> userIds)
    {
        send(notiTypeDevName, targetId, targetPageRef, title, body, userIds);
    }
    
    private static void send(String notiTypeDevName
        , String targetId
        , String targetPageRef
        , String title
        , String body
        , Set<String> userIds)
    {
        CustomNotificationType type = [SELECT Id FROM CustomNotificationType WHERE DeveloperName = :notiTypeDevName];
        
        Messaging.CustomNotification notification = new Messaging.CustomNotification();
        
        notification.setBody(body);
        notification.setTitle(title);
        notification.setSenderId(Userinfo.getUserId());
        notification.setNotificationTypeId(type.id);
        if(String.isNotEmpty(targetId)) {
            notification.setTargetId(targetId);
        } else {
            notification.setTargetPageRef(targetPageRef);
        }
        try { notification.send(userIds); } catch (Exception e) {
            System.debug('Problem sending notification: ' + e.getMessage());
        }
    }
}

/*
============================================
    =                 사용 예시                  =
    ============================================
    
// Trigger에서 비동기 호출 시
UTIL_Notification.calloutSend(
    'SampleNotification'
    , System.UserInfo.getUserId()
    , null
    , '알림 제목'
    , '알림 내용입니다.'
, new Set<String>{
    System.UserInfo.getUserId()
}
);

// Batch나 Controller에서 동기방식 실행 시
UTIL_Notification.unCalloutSend(
    'SampleNotification'
    , System.UserInfo.getUserId()
    , null
    , '알림 제목'
    , '알림 내용입니다.'
, new Set<String>{
    System.UserInfo.getUserId()
}
);

[참조]
    https://developer.salesforce.com/docs/atlas.en-us.230.0.lightning.meta/lightning/components_navigation_page_definitions.htm
     */